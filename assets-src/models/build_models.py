# Builds the scene models (contracts/scene-model.md) in Blender, saves each source as
# assets-src/models/<name>.blend and exports the raw glTF binary next to it; then
# `npm run models:optimize` compresses them into public/models/.
#
# The room and its objects are the « tour » style chosen in spec 003 (decision.md), built by
# tower_room.py; the room's lighting is baked with Cycles (room-day.png, room-night.png).
#
# Run in Blender (Blender 5.1 or newer), from the repository root:
#   blender --background --python assets-src/models/build_models.py [-- --only <name> ...]
# or from a live Blender session:
#   MODELS_DIR = r"<repo>/assets-src/models"
#   exec(open(MODELS_DIR + "/build_models.py", encoding="utf-8").read()); main()
#
# Coordinates in this file are in the glTF / three.js convention of the contract: Y up, the
# room's visible walls at -X (west) and -Z (north), objects facing +Z. `P()` converts them to
# Blender's Z-up axes; the glTF exporter converts back.
import math
import os
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

try:
    ROOT = os.path.dirname(os.path.abspath(__file__))
except NameError:  # exec() from a live session: set MODELS_DIR first
    ROOT = MODELS_DIR  # noqa: F821


def P(x, y, z):
    """glTF (x, y, z) to Blender (x, -z, y)."""
    return Vector((x, -z, y))


def matrix(x, y, z, rot=0.0, tilt=0.0, size=(1, 1, 1)):
    """Placement in glTF terms: position, rotation about the up axis, tilt about X (positive
    leans the top towards the front), size (width, height, depth)."""
    w, h, d = size
    return (
        Matrix.Translation(P(x, y, z))
        @ Matrix.Rotation(rot, 4, "Z")
        @ Matrix.Rotation(tilt, 4, "X")
        @ Matrix.Diagonal((w, d, h, 1))
    )


class Builder:
    """Accumulates geometry per material: one object per material keeps draw calls low."""

    def __init__(self, palette):
        self.palette = palette
        self.meshes = {}

    def _bm(self, material):
        if material not in self.meshes:
            bm = bmesh.new()
            bm.loops.layers.uv.verify()
            self.meshes[material] = bm
        return self.meshes[material]

    def box(self, material, w, h, d, x, y, z, rot=0.0, tilt=0.0):
        bmesh.ops.create_cube(
            self._bm(material), size=1, matrix=matrix(x, y, z, rot, tilt, (w, h, d))
        )

    def cylinder(self, material, r, h, x, y, z, segments=16, r2=None, rot=0.0, tilt=0.0):
        """Vertical cylinder (or cone with r2) centred at (x, y, z)."""
        bmesh.ops.create_cone(
            self._bm(material),
            cap_ends=True,
            segments=segments,
            radius1=r,
            radius2=r if r2 is None else r2,
            depth=h,
            matrix=matrix(x, y, z, rot, tilt),
        )

    def ellipse(self, material, rx, rz, h, x, y, z, segments=40, rot=0.0):
        """Flat oval (or round) slab centred at (x, y, z): radii `rx` along its own X, `rz`
        along its own Z, thickness `h`."""
        bmesh.ops.create_cone(
            self._bm(material),
            cap_ends=True,
            segments=segments,
            radius1=1,
            radius2=1,
            depth=1,
            matrix=matrix(x, y, z, rot, 0.0, (rx, h, rz)),
        )

    def blob(self, material, w, h, d, x, y, z, rot=0.0, tilt=0.0):
        """Ellipsoid of half-sizes (w, h, d) centred at (x, y, z) (leaves, cushions)."""
        bmesh.ops.create_uvsphere(
            self._bm(material), u_segments=12, v_segments=6, radius=1,
            matrix=matrix(x, y, z, rot, tilt, (w, h, d)),
        )

    def sphere(self, material, r, x, y, z):
        bmesh.ops.create_uvsphere(
            self._bm(material), u_segments=10, v_segments=6, radius=r, matrix=matrix(x, y, z)
        )

    def plane(self, material, w, h, x, y, z, rot=0.0, tilt=0.0):
        """Upright rectangle facing +Z, UVs covering the image right side up."""
        bmesh.ops.create_grid(
            self._bm(material),
            x_segments=1,
            y_segments=1,
            size=0.5,
            calc_uvs=True,
            matrix=matrix(x, y, z, rot, tilt)
            @ Matrix.Rotation(math.pi / 2, 4, "X")
            @ Matrix.Diagonal((w, h, 1, 1)),
        )

    def build(self, prefix, bevel=0.006, flat=("screen", "label")):
        objects = []
        for name, bm in self.meshes.items():
            mesh = bpy.data.meshes.new(f"{prefix}.{name}")
            bm.to_mesh(mesh)
            bm.free()
            mesh.materials.append(material(name, self.palette[name]))
            obj = bpy.data.objects.new(f"{prefix}.{name}", mesh)
            bpy.context.scene.collection.objects.link(obj)
            if bevel and name not in flat:
                mod = obj.modifiers.new("bevel", "BEVEL")
                mod.width = bevel
                mod.segments = 1
                mod.limit_method = "ANGLE"
            objects.append(obj)
        self.meshes = {}
        return objects


def material(name, spec):
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    color, roughness = spec if isinstance(spec, tuple) else (spec, 0.8)
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    rgb = [int(color[i : i + 2], 16) / 255 for i in (1, 3, 5)]
    # Hex colours are sRGB; Blender works in linear.
    linear = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb]
    bsdf.inputs["Base Color"].default_value = (*linear, 1)
    bsdf.inputs["Roughness"].default_value = roughness
    mat.diffuse_color = (*linear, 1)
    return mat


def empty(name, x, y, z, rot=0.0, scale=None):
    obj = bpy.data.objects.new(name, None)
    obj.empty_display_type = "ARROWS"
    obj.empty_display_size = 0.15
    obj.location = P(x, y, z)
    obj.rotation_euler = (0, 0, rot)
    if scale:
        sx, sy, sz = scale
        obj.scale = (sx, sz, sy)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def reset():
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj)
    for collection in (bpy.data.meshes, bpy.data.materials):
        for block in list(collection):
            collection.remove(block)


def save(name, out=None):
    out = out or ROOT
    path = os.path.join(out, f"{name}.blend")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=path, copy=True, compress=True)
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(out, f"{name}.glb"),
        export_format="GLB",
        export_yup=True,
        export_apply=True,
        export_cameras=False,
        export_lights=False,
        export_extras=False,
        use_selection=False,
    )
    print(f"✓ {name}")


# ---------------------------------------------------------------------------------------------
# Slots and markers the scene reads in the room (contracts/scene-model.md).


def room_markers(
    lamps=((-3.5, 1.55, 3.4),),
    projects=None,
    featured=None,
    education=None,
    experience=None,
    neon_lights=(),
    avatar_seat=None,
):
    """Slots and markers (same names and places as the provisional room in src/scene/room.ts,
    unless a room passes its own places and lights). A place is (x, y, z, rotation)."""
    pad = lambda n: f"{n:02d}"
    projects = projects or [
        (-0.4 + (i % 3), 0.8, 0.05 if i < 3 else 0.75, math.pi / 4) for i in range(6)
    ]
    education = education or [
        (-3.97, 2.1 if i < 2 else 1.45, -2.4 + (i % 2) * 1.2, math.pi / 2) for i in range(4)
    ]
    experience = experience or [
        (0.95 + (i % 2) * 1.3, 2.1 if i < 2 else 1.45, -3.93, 0.0) for i in range(4)
    ]
    for kind, places in (("project", projects), ("education", education), ("experience", experience)):
        for i, place in enumerate(places):
            empty(f"slot.{kind}.{pad(i + 1)}", *place)
    featured = featured or {
        "lesson-folk": (-2.7, 0.8, -3.72, 0.0),
        "portfolio-3d": (-1.7, 0.8, -3.72, 0.0),
    }
    for id_, place in featured.items():
        empty(f"featured.{id_}", *place)
    # Night point lights (contracts/scene-ambiance.md): warm in the lamps, LED-coloured glows.
    for i, place in enumerate(lamps):
        empty(f"light.lamp.{pad(i + 1)}", *place)
    for i, place in enumerate(neon_lights):
        empty(f"light.neon.{pad(i + 1)}", *place)
    if avatar_seat:
        empty("avatar.seat", *avatar_seat)
    empty("camera.home", 0, 0.9, -0.4)
    empty("bounds", 0, 1.5, 0, scale=(4, 1.5, 4))


# ---------------------------------------------------------------------------------------------
# The overflow box (« more … »), at the last slot of a type that has too many items. The other
# objects are in tower_room.py. Origin at the anchor, front towards +Z.

OBJECT_PALETTE = {
    "label": "#fbf8f1",
    "carton": "#a8743f",
    "tape": ("#d9c39a", 0.5),
}


def build_overflow():
    b = Builder(OBJECT_PALETTE)
    b.box("carton", 0.56, 0.4, 0.46, 0, 0.2, 0)
    b.box("carton", 0.56, 0.012, 0.2, 0, 0.42, -0.26, tilt=math.radians(-35))
    b.box("carton", 0.56, 0.012, 0.2, 0, 0.42, 0.26, tilt=math.radians(35))
    b.box("tape", 0.08, 0.005, 0.46, 0, 0.4, 0)
    b.plane("label", 0.36, 0.22, 0, 0.2, 0.231)
    b.build("overflow")


# The room and its objects (style « tour », baked lighting) live in their own file.
exec(open(os.path.join(ROOT, "tower_room.py"), encoding="utf-8").read())

def save_overflow(out):
    reset()
    build_overflow()
    save("overflow", out)


# Model name -> function that builds and saves it into a folder. tower_room.py defines
# build_tower_room_baked, TOWER_OBJECTS and build_tower_object.
MODELS = {
    "room": build_tower_room_baked,  # noqa: F821
    **{name: (lambda out, name=name: build_tower_object(name, out)) for name in TOWER_OBJECTS},  # noqa: F821
    "overflow": save_overflow,
}


def main(names=None, out=None):
    for name in names or MODELS:
        MODELS[name](out or ROOT)


def cli_args():
    """`--only <name>` (repeatable) and `--out <dir>`, after Blender's own `--`."""
    args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    options = {}
    names = [args[i + 1] for i, a in enumerate(args) if a == "--only"]
    for name in names:
        if name not in MODELS:
            raise SystemExit(f"unknown model: {name} (one of {', '.join(MODELS)})")
    if names:
        options["names"] = names
    if "--out" in args:
        options["out"] = os.path.abspath(args[args.index("--out") + 1])
    return options


if __name__ == "__main__":
    main(**cli_args())
