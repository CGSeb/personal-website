# Builds the scene models (contracts/scene-model.md) in Blender, saves each source as
# assets-src/models/<name>.blend and exports the raw glTF binary next to it; then
# `npm run models:optimize` compresses them into public/models/.
#
# Run in Blender (Blender 5.1 or newer), from the repository root:
#   blender --background --python assets-src/models/build_models.py
# or from a live Blender session:
#   MODELS_DIR = r"<repo>/assets-src/models"
#   exec(open(MODELS_DIR + "/build_models.py", encoding="utf-8").read()); main()
#
# Style mockups (spec 003, contracts/mockups.md): only the room, in a candidate style, saved as
# <out>/room-<style>.blend and .glb:
#   blender --background --python assets-src/models/build_models.py -- --style atelier --out mockups/models
#   (from a live session: main(style="atelier", out=r"<repo>/mockups/models"))
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
# The room: 8 × 8 m, floor at y = 0, walls on the west and north sides.

ROOM_PALETTE = {
    "floor": "#c99a6b",
    "plank": "#b5865a",
    "wall": "#efe7dc",
    "wall-north": "#f5efe6",
    "skirting": "#d9ccba",
    "walnut": "#7a5236",
    "dark-wood": "#4a3a2e",
    "cork": "#c69863",
    "oak": "#a97c52",
    "rug": "#bf5a40",
    "rug-border": "#efd9b8",
    "fabric": "#3f5b73",
    "window-frame": "#fbfaf7",
    "window": ("#bcd8ea", 0.15),
    "pot": "#cf7b4f",
    "leaf": "#5c8c4a",
    "metal": "#3a3d42",
    "lamp": "#f4e3c1",
    "book-a": "#2f5d7c",
    "book-b": "#b8483a",
    "book-c": "#e0b34a",
    "book-d": "#4f7a57",
}

# Candidate styles of spec 003 (research § 6): same room, same slots; their own palette and the
# piece of furniture that carries the projects. Mockup rooms stay simple.
ATELIER_PALETTE = {
    **ROOM_PALETTE,
    "floor": "#b07a4c",
    "plank": "#9a6840",
    "wall": "#eadbc6",
    "wall-north": "#f1e4d0",
    "skirting": "#c9b08f",
    "walnut": "#6b4428",
    "dark-wood": "#3f2c1f",
    "oak": "#b8864f",
    "cork": "#c08a52",
    "rug": "#a8462e",
    "rug-border": "#e9cfa4",
    "fabric": "#7a4a2f",
    "pot": "#c0663c",
    "leaf": "#4f7d3c",
    "metal": "#2f2a26",
    "lamp": "#f2d6a2",
    "bench": "#a06a3b",
    "bench-top": "#c48d55",
    "tool": "#5b5f63",
}

BUREAU_PALETTE = {
    **ROOM_PALETTE,
    "floor": "#d8d4cd",
    "plank": "#cbc6be",
    "wall": "#f4f4f2",
    "wall-north": "#fafaf8",
    "skirting": "#e2e2df",
    "walnut": "#cfc8bd",
    "dark-wood": "#5b6068",
    "oak": "#e7e2da",
    "cork": "#dfe3e6",
    "rug": "#4d6f8a",
    "rug-border": "#e3e8ec",
    "fabric": "#3b4752",
    "pot": "#f2f2f0",
    "leaf": "#5f8f63",
    "metal": "#9aa0a6",
    "lamp": "#fbfbf8",
    "desk": "#fcfcfb",
    "desk-leg": "#2f3439",
}


def table_support(b):
    """The walnut work table of the current room."""
    b.box("walnut", 3.2, 0.08, 1.6, 0.6, 0.76, 0.4)
    for x, z in ((-0.9, -0.3), (2.1, -0.3), (-0.9, 1.1), (2.1, 1.1)):
        b.box("dark-wood", 0.08, 0.72, 0.08, x, 0.36, z)
    b.box("dark-wood", 2.9, 0.08, 0.04, 0.6, 0.62, -0.3)


def workbench_support(b):
    """Atelier: a thick wooden workbench with a low shelf and a few tools."""
    b.box("bench-top", 3.4, 0.12, 1.7, 0.6, 0.74, 0.4)
    for x, z in ((-0.95, -0.35), (2.15, -0.35), (-0.95, 1.15), (2.15, 1.15)):
        b.box("bench", 0.14, 0.68, 0.14, x, 0.34, z)
    b.box("bench", 3.1, 0.04, 1.4, 0.6, 0.18, 0.4)
    b.box("bench", 3.1, 0.1, 0.06, 0.6, 0.6, -0.35)
    b.box("tool", 0.04, 0.03, 0.32, 2.0, 0.815, 1.0, rot=math.radians(20))
    b.box("tool", 0.12, 0.06, 0.08, 2.0, 0.83, 0.85, rot=math.radians(20))
    b.cylinder("dark-wood", 0.12, 0.2, -0.85, 0.28, 0.9, 12)


def desk_support(b):
    """Bureau moderne: a white thin-top desk on slim dark legs."""
    b.box("desk", 3.2, 0.03, 1.5, 0.6, 0.785, 0.4)
    for x in (-0.85, 2.05):
        b.box("desk-leg", 0.04, 0.77, 0.04, x, 0.385, -0.2)
        b.box("desk-leg", 0.04, 0.77, 0.04, x, 0.385, 1.0)
        b.box("desk-leg", 0.04, 0.04, 1.24, x, 0.06, 0.4)
    b.box("desk-leg", 2.9, 0.03, 0.03, 0.6, 0.7, -0.2)


STYLES = {
    "site": (ROOM_PALETTE, table_support),
    "atelier": (ATELIER_PALETTE, workbench_support),
    "bureau": (BUREAU_PALETTE, desk_support),
}


def plant(b, x, y, z, size=1.0):
    """Small potted plant standing at (x, y, z)."""
    b.cylinder("pot", 0.09 * size, 0.16 * size, x, y + 0.08 * size, z, segments=10, r2=0.07 * size)
    for i, (dx, dz, h) in enumerate(((0, 0, 0.32), (0.05, 0.03, 0.26), (-0.04, 0.04, 0.28))):
        r = (0.06 - i * 0.008) * size
        b.cylinder("leaf", r, h * size, x + dx * size, y + (0.16 + h / 2) * size, z + dz * size, 6, r2=0.0)


def build_shelf(palette):
    """Bookshelf on the west wall, south of the diplomas, with plants on top (decor.shelf)."""
    b = Builder(palette)
    # Open at the front (+X): back, sides, top, shelves.
    b.box("oak", 0.02, 1.9, 1.4, -3.98, 0.95, 1.6)
    for z in (0.91, 2.29):
        b.box("oak", 0.32, 1.9, 0.02, -3.83, 0.95, z)
    b.box("oak", 0.32, 0.03, 1.4, -3.83, 1.885, 1.6)
    for y in (0.05, 0.5, 0.95, 1.4):
        b.box("walnut", 0.3, 0.03, 1.36, -3.83, y + 0.015, 1.6)
    books = ("book-a", "book-b", "book-c", "book-d")
    for shelf, y in enumerate((0.065, 0.515, 0.965, 1.415)):
        z = 1.0
        for i in range(9 - shelf):
            h = 0.24 + ((i * 7 + shelf * 3) % 5) * 0.025
            w = 0.05 + ((i + shelf) % 3) * 0.015
            b.box(books[(i + shelf) % 4], 0.22, h, w, -3.82, y + h / 2, z + w / 2)
            z += w + 0.012
            if z > 2.15:
                break
    plant(b, -3.83, 1.9, 1.2)
    plant(b, -3.83, 1.9, 2.05, 0.8)
    b.build("decor.shelf")


def build_room(style="site"):
    palette, support = STYLES[style]
    b = Builder(palette)

    # Floor with plank seams, walls, skirting.
    b.box("floor", 8, 0.1, 8, 0, -0.05, 0)
    for i in range(1, 16):
        b.box("plank", 0.012, 0.004, 8, -4 + i * 0.5, 0.001, 0)
    b.box("wall", 0.15, 3, 8.15, -4.075, 1.5, -0.075)
    b.box("wall-north", 8, 3, 0.15, 0, 1.5, -4.075)
    b.box("skirting", 0.02, 0.1, 8, -3.99, 0.05, 0)
    b.box("skirting", 8, 0.1, 0.02, 0, 0.05, -3.99)

    # Support of the projects, per style (6 slots on its top, at y = 0.8).
    support(b)

    # Chair behind the table.
    b.box("fabric", 0.5, 0.08, 0.5, 0.6, 0.46, -0.95)
    b.box("fabric", 0.5, 0.5, 0.07, 0.6, 0.75, -1.18)
    for x, z in ((0.38, -0.75), (0.82, -0.75), (0.38, -1.15), (0.82, -1.15)):
        b.box("metal", 0.035, 0.42, 0.035, x, 0.21, z)

    # Cork board on the north wall (experience cards at z = -3.93).
    b.box("dark-wood", 2.75, 1.55, 0.03, 1.6, 1.75, -3.985)
    b.box("cork", 2.6, 1.4, 0.05, 1.6, 1.75, -3.97)

    # Window and sideboard for the featured projects, north wall, west part.
    b.box("window-frame", 1.3, 1.1, 0.06, -2.2, 1.95, -3.98)
    b.box("window", 1.14, 0.94, 0.02, -2.2, 1.95, -3.95)
    b.box("window-frame", 0.04, 0.94, 0.04, -2.2, 1.95, -3.94)
    b.box("window-frame", 1.14, 0.04, 0.04, -2.2, 1.95, -3.94)
    b.box("window-frame", 1.4, 0.05, 0.16, -2.2, 1.38, -3.92)
    b.box("oak", 1.8, 0.7, 0.5, -2.2, 0.4, -3.72)
    b.box("walnut", 1.84, 0.05, 0.54, -2.2, 0.775, -3.72)
    for x in (-2.65, -1.75):
        b.box("dark-wood", 0.86, 0.6, 0.01, x, 0.4, -3.465)
        b.box("metal", 0.12, 0.02, 0.02, x, 0.55, -3.455)
    for x in (-3.0, -1.4):
        b.box("dark-wood", 0.05, 0.05, 0.05, x, 0.025, -3.55)

    # Plant in the north-west corner.
    b.cylinder("pot", 0.2, 0.42, -3.62, 0.21, -3.62, segments=12, r2=0.16)
    for i, (dx, dz, h) in enumerate(
        ((0, 0, 0.9), (0.12, 0.05, 0.7), (-0.1, 0.1, 0.75), (0.05, -0.12, 0.8))
    ):
        b.cylinder("leaf", 0.13 - i * 0.015, h, -3.62 + dx, 0.42 + h / 2, -3.62 + dz, 6, r2=0.0)

    # Rug, armchair and floor lamp in the reading corner.
    b.box("rug-border", 2.3, 0.012, 1.7, -2.1, 0.006, 2.3)
    b.box("rug", 2.1, 0.014, 1.5, -2.1, 0.007, 2.3)
    # Armchair facing the room: seat, back behind it, two arms.
    r = math.radians(60)
    cx, cz = -2.75, 2.35
    fx, fz = math.sin(r), math.cos(r)  # front
    sx, sz = math.cos(r), -math.sin(r)  # side
    b.box("fabric", 0.8, 0.4, 0.75, cx, 0.22, cz, rot=r)
    b.box("fabric", 0.8, 0.5, 0.16, cx - fx * 0.33, 0.65, cz - fz * 0.33, rot=r)
    for side in (-1, 1):
        b.box("fabric", 0.14, 0.24, 0.75, cx + sx * side * 0.37, 0.52, cz + sz * side * 0.37, rot=r)
    b.cylinder("metal", 0.16, 0.03, -3.5, 0.015, 3.4)
    b.cylinder("metal", 0.015, 1.5, -3.5, 0.78, 3.4, 8)
    b.cylinder("lamp", 0.22, 0.3, -3.5, 1.6, 3.4, 16, r2=0.14)

    b.build("room")
    build_shelf(palette)

    # Slots and markers (same names and places as the provisional room in src/scene/room.ts).
    pad = lambda n: f"{n:02d}"
    for i in range(6):
        empty(f"slot.project.{pad(i + 1)}", -0.4 + (i % 3), 0.8, 0.05 if i < 3 else 0.75, math.pi / 4)
    for i in range(4):
        empty(
            f"slot.education.{pad(i + 1)}",
            -3.97,
            2.1 if i < 2 else 1.45,
            -2.4 + (i % 2) * 1.2,
            math.pi / 2,
        )
    for i in range(4):
        empty(f"slot.experience.{pad(i + 1)}", 0.95 + (i % 2) * 1.3, 2.1 if i < 2 else 1.45, -3.93)
    empty("featured.lesson-folk", -2.7, 0.8, -3.72)
    empty("featured.portfolio-3d", -1.7, 0.8, -3.72)
    # Night point light inside the floor lamp's shade (contracts/scene-ambiance.md).
    empty("light.lamp.01", -3.5, 1.55, 3.4)
    empty("camera.home", 0, 0.9, -0.4)
    empty("bounds", 0, 1.5, 0, scale=(4, 1.5, 4))


# ---------------------------------------------------------------------------------------------
# Generic objects: origin at the anchor, front towards +Z, real size (slightly generous, so
# they read well from the isometric view).

OBJECT_PALETTE = {
    "screen": ("#e8eaf6", 0.4),
    "label": "#fbf8f1",
    "bezel": ("#20242b", 0.5),
    "stand": ("#5a6068", 0.5),
    "frame": "#3b3127",
    "paper": "#fffdf6",
    "pin": ("#d23b3b", 0.4),
    "carton": "#b98a55",
    "tape": ("#d9c39a", 0.5),
}


def build_generic_project():
    b = Builder(OBJECT_PALETTE)
    b.box("bezel", 0.72, 0.46, 0.035, 0, 0.4, 0)
    b.plane("screen", 0.66, 0.4, 0, 0.4, 0.0185)
    b.box("stand", 0.06, 0.2, 0.03, 0, 0.12, -0.03)
    b.cylinder("stand", 0.14, 0.015, 0, 0.0075, -0.02, 24)
    b.build("generic-project")


def build_generic_education():
    b = Builder(OBJECT_PALETTE)
    b.box("frame", 0.5, 0.38, 0.03, 0, 0, 0.015)
    b.plane("label", 0.42, 0.3, 0, 0, 0.0305)
    b.build("generic-education")


def build_generic_experience():
    b = Builder(OBJECT_PALETTE)
    b.box("paper", 0.55, 0.36, 0.004, 0, 0, 0.002)
    b.plane("label", 0.53, 0.34, 0, 0, 0.0045)
    b.sphere("pin", 0.02, 0, 0.14, 0.02)
    b.build("generic-experience", bevel=0)


def build_overflow():
    b = Builder(OBJECT_PALETTE)
    b.box("carton", 0.56, 0.4, 0.46, 0, 0.2, 0)
    b.box("carton", 0.56, 0.012, 0.2, 0, 0.42, -0.26, tilt=math.radians(-35))
    b.box("carton", 0.56, 0.012, 0.2, 0, 0.42, 0.26, tilt=math.radians(35))
    b.box("tape", 0.08, 0.005, 0.46, 0, 0.4, 0)
    b.plane("label", 0.36, 0.22, 0, 0.2, 0.231)
    b.build("overflow")


# ---------------------------------------------------------------------------------------------
# Dedicated objects of the featured projects (≤ 300 KB each once optimized).

FEATURED_PALETTE = {
    **OBJECT_PALETTE,
    **{k: ROOM_PALETTE[k] for k in ("book-a", "book-b", "book-c", "book-d", "oak", "walnut")},
    "laptop": ("#b9bec6", 0.35),
    "keys": ("#3a3d42", 0.6),
    "mini-floor": "#c99a6b",
    "mini-wall": "#efe7dc",
    "mini-wall-north": "#f5efe6",
    "base": "#2e3138",
}


def build_lesson_folk():
    """LessonFolk, the AI tutor: an open laptop showing the project, and a stack of books."""
    b = Builder(FEATURED_PALETTE)
    b.box("laptop", 0.5, 0.022, 0.34, 0, 0.011, 0.02)
    b.box("keys", 0.44, 0.004, 0.16, 0, 0.024, -0.01)
    lid = math.radians(-15)
    # The lid hinges at the back edge of the base and leans back.
    hy, hz = 0.022, -0.15
    cy, cz = hy + 0.16 * math.cos(lid), hz + 0.16 * math.sin(lid)
    b.box("laptop", 0.5, 0.32, 0.014, 0, cy, cz - 0.007, tilt=lid)
    b.plane("screen", 0.46, 0.28, 0, cy, cz + 0.0005, tilt=lid)
    for i, (book, h) in enumerate((("book-a", 0.05), ("book-b", 0.04), ("book-c", 0.045))):
        y = sum((0.05, 0.04, 0.045)[:i]) + h / 2
        b.box(book, 0.24, h, 0.32, 0.4, y, -0.02, rot=math.radians(8 * (i - 1)))
    b.build("lesson-folk")


def build_portfolio_3d():
    """This portfolio: a small diorama of the room itself, on a dark plinth."""
    b = Builder(FEATURED_PALETTE)
    b.box("base", 0.5, 0.06, 0.5, 0, 0.03, 0)
    b.box("mini-floor", 0.44, 0.02, 0.44, 0, 0.07, 0)
    b.box("mini-wall", 0.02, 0.26, 0.44, -0.21, 0.2, 0)
    b.box("mini-wall-north", 0.44, 0.26, 0.02, 0, 0.2, -0.21)
    b.box("walnut", 0.2, 0.012, 0.1, 0.03, 0.125, 0.02)
    for x, z in ((-0.06, -0.02), (0.12, -0.02), (-0.06, 0.06), (0.12, 0.06)):
        b.box("oak", 0.008, 0.04, 0.008, x, 0.1, z)
    b.box("paper", 0.008, 0.06, 0.08, -0.195, 0.2, -0.05)
    b.box("book-b", 0.03, 0.08, 0.1, -0.18, 0.12, 0.13)
    b.plane("screen", 0.16, 0.1, 0.06, 0.2, -0.198)
    b.build("portfolio-3d", bevel=0.002)


MODELS = {
    "room": build_room,
    "generic-project": build_generic_project,
    "generic-education": build_generic_education,
    "generic-experience": build_generic_experience,
    "overflow": build_overflow,
    "featured/lesson-folk": build_lesson_folk,
    "featured/portfolio-3d": build_portfolio_3d,
}


def main(names=None, style=None, out=None):
    if style:
        reset()
        build_room(style)
        save(f"room-{style}", out)
        return
    for name in names or MODELS:
        reset()
        MODELS[name]()
        save(name, out)


def cli_args():
    """`--style <name>` and `--out <dir>`, after Blender's own `--`."""
    args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    options = {}
    for key in ("style", "out"):
        if f"--{key}" in args:
            options[key] = args[args.index(f"--{key}") + 1]
    if options.get("style") not in (None, *STYLES):
        raise SystemExit(f"unknown style: {options['style']} (one of {', '.join(STYLES)})")
    if "out" in options:
        options["out"] = os.path.abspath(options["out"])
    return options


if __name__ == "__main__":
    main(**cli_args())
