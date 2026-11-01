# Renders the figure for the likeness check (specs/004-scene-avatar, T006-T008), without baking:
# alone from the front and at three-quarters, then in the room from the scene's direction (1, 1, 1)
# at the size of a phone and of a computer, by day and by night. The PNGs go to
# specs/004-scene-avatar/captures/.
#
# Run from the repository root, after `build_models.py -- --only avatar`:
#   blender --background --python assets-src/models/render_avatar.py
#
# The room is room.blend with its baked textures (public/models/room-*.webp) shown unlit, as the
# scene does. The placed objects are left out. The lights on the figure copy src/scene/ambiance.ts and lighting.ts (three.js and Blender share the same
# units for a sun and, divided by π, for an ambient light).
import math
import os

import bpy
import numpy as np
from mathutils import Matrix, Vector

ROOT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(ROOT, "..", ".."))
OUT = os.path.join(REPO, "specs", "004-scene-avatar", "captures")

# Coordinates in glTF terms, as in build_models.py.
ISO = Vector((1, 1, 1)).normalized()
HOME = (0, 0.9, -0.4)  # `camera.home` of tower_markers
EXTENTS = (3.25, 3.18)  # half-sizes of the room seen from the camera (renderer.ts, `extents`)
FIT_MARGIN = 1.04
SEAT = (-0.6, 0.525, -0.95)
HEAD_Y = 1.25  # height of the middle of the head in the room

AMBIANCES = {
    # world colour and strength, sun (colour, strength, position)
    "day": ("#fff0dc", 0.82, ("#fff3e0", 2.7, (5, 9, 6))),
    "night": ("#ffc98a", 0.72, ("#b8c4ff", 0.35, (-3, 7, -8))),
}
PHONE = (390, 700)
DESKTOP = (1280, 720)
CROP = 64  # half-size of the phone crop around the figure, in real pixels
ZOOM = 5  # the crop enlarged, without smoothing, to look at its pixels
# Where the wave will reach (T021), to check the pivot: axis in the arm's frame, angle in radians.
RAISED = (Vector((1, 0, 0.2)).normalized(), -1.6)


def P(x, y, z):
    return Vector((x, -z, y))


def linear(hex_):
    c = [int(hex_[i : i + 2], 16) / 255 for i in (1, 3, 5)]
    return [v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c]


def setup_render(ambiance, background):
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 48
    scene.cycles.use_denoising = False
    scene.cycles.max_bounces = 2
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = 0.0
    scene.render.film_transparent = False
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    world_color, world_strength, (sun_color, sun_strength, sun_at) = AMBIANCES[ambiance]
    for o in [o for o in bpy.data.objects if o.type in ("LIGHT", "CAMERA")]:
        bpy.data.objects.remove(o)
    world = bpy.data.worlds.get("avatar") or bpy.data.worlds.new("avatar")
    world.use_nodes = True
    nt = world.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    bg = nt.nodes.new("ShaderNodeBackground")
    bg.inputs["Color"].default_value = (*linear(world_color), 1)
    bg.inputs["Strength"].default_value = world_strength
    # The world lights the figure; the camera sees a plain background instead.
    seen = nt.nodes.new("ShaderNodeBackground")
    seen.inputs["Color"].default_value = (*linear(background), 1)
    path = nt.nodes.new("ShaderNodeLightPath")
    mix = nt.nodes.new("ShaderNodeMixShader")
    out = nt.nodes.new("ShaderNodeOutputWorld")
    nt.links.new(path.outputs["Is Camera Ray"], mix.inputs[0])
    nt.links.new(bg.outputs[0], mix.inputs[1])
    nt.links.new(seen.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs["Surface"])
    scene.world = world
    data = bpy.data.lights.new("sun", "SUN")
    data.color = linear(sun_color)
    data.energy = sun_strength
    data.angle = math.radians(6)
    sun = bpy.data.objects.new("sun", data)
    sun.rotation_euler = P(*sun_at).to_track_quat("Z", "Y").to_euler()
    scene.collection.objects.link(sun)


def camera(direction, target, width, size):
    """An orthographic camera looking at `target` from `direction`, `width` metres across."""
    data = bpy.data.cameras.new("camera")
    data.type = "ORTHO"
    w, h = size
    data.ortho_scale = max(width, width * h / w)
    cam = bpy.data.objects.new("camera", data)
    cam.location = P(*target) + P(*direction).normalized() * 20
    cam.rotation_euler = P(*direction).to_track_quat("Z", "Y").to_euler()
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    bpy.context.scene.render.resolution_x = w
    bpy.context.scene.render.resolution_y = h
    bpy.context.view_layer.update()
    return cam


def render(name, border=None):
    scene = bpy.context.scene
    scene.render.use_border = border is not None
    scene.render.use_crop_to_border = border is not None
    if border:
        scene.render.border_min_x, scene.render.border_min_y = border[0], border[1]
        scene.render.border_max_x, scene.render.border_max_y = border[2], border[3]
    path = os.path.join(OUT, f"{name}.png")
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print(f"✓ {name}")
    return path


def read_rgb(path):
    img = bpy.data.images.load(path, check_existing=False)
    w, h = img.size
    px = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, img.channels)[:, :, :3]
    bpy.data.images.remove(img)
    return px  # rows from the bottom, as Blender stores them


def write_rgb(path, px):
    h, w = px.shape[:2]
    img = bpy.data.images.new("out", w, h)
    rgba = np.concatenate((px, np.ones((h, w, 1), dtype=np.float32)), axis=2)
    img.pixels = rgba.ravel().tolist()
    img.filepath_raw = path
    img.file_format = "PNG"
    img.save()
    bpy.data.images.remove(img)


def enlarge(path, factor=ZOOM):
    px = read_rgb(path).repeat(factor, axis=0).repeat(factor, axis=1)
    target = path[:-4] + f"-x{factor}.png"
    write_rgb(target, px)
    return target


def resample(px, height):
    """Nearest resize when enlarging, box average when reducing."""
    h, w = px.shape[:2]
    width = round(w * height / h)
    ys = (np.arange(height) * h / height).astype(int)
    xs = (np.arange(width) * w / width).astype(int)
    return px[ys][:, xs]


def sheet(paths, name, height=420, gap=12):
    """The images side by side at the same height, the profile photo first."""
    parts = [resample(read_rgb(p), height) for p in paths]
    width = sum(p.shape[1] for p in parts) + gap * (len(parts) - 1)
    out = np.ones((height, width, 3), dtype=np.float32)
    x = 0
    for part in parts:
        out[:, x : x + part.shape[1]] = part
        x += part.shape[1] + gap
    target = os.path.join(OUT, f"{name}.png")
    write_rgb(target, out)
    print(f"✓ {name}")


def load_avatar():
    """Appends avatar.blend's objects and returns them with their root objects."""
    with bpy.data.libraries.load(os.path.join(ROOT, "avatar.blend"), link=False) as (src, dst):
        dst.objects = list(src.objects)
    for o in dst.objects:
        bpy.context.scene.collection.objects.link(o)
    return dst.objects


def raise_arm(raised):
    arm = bpy.data.objects["avatar.arm"]
    axis, angle = RAISED
    arm.rotation_mode = "QUATERNION"
    # The axis is in glTF terms; `P` turns it into Blender's.
    arm.rotation_quaternion = Matrix.Rotation(angle if raised else 0.0, 3, P(*axis)).to_quaternion()


def render_alone():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    load_avatar()
    bg = "#e9e4da"
    setup_render("day", bg)
    target = (0, 0.42, 0.05)
    size = (640, 900)
    width = 1.2
    # `from-camera` is the scene's view once the chair is turned: (1, 1, 1) in the figure's axes.
    views = {"front": (0, 0.12, 1), "three-quarter": (-0.75, 0.2, 1), "from-camera": (0, 1, math.sqrt(2))}
    paths = {}
    for name, direction in views.items():
        camera(direction, target, width, size)
        paths[name] = render(f"avatar-{name}")
    # The head alone, larger.
    head = (0, 0.74, 0.03)
    size = (640, 640)
    for name, direction in (("front", (0, 0.12, 1)), ("three-quarter", (-0.8, 0.12, 1)), ("side", (-1, 0.05, 0))):
        camera(direction, head, 0.62, size)
        paths[f"head-{name}"] = render(f"avatar-head-{name}")
    raise_arm(True)
    camera(views["from-camera"], (0, 0.5, 0.05), 1.4, (640, 640))
    render("avatar-arm-raised")
    raise_arm(False)
    return paths


def baked_material(room, ambiance):
    mat = bpy.data.materials.new(f"baked-{ambiance}")
    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(os.path.join(REPO, "public", "models", f"room-{ambiance}.webp"), check_existing=True)
    emit = nt.nodes.new("ShaderNodeEmission")
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(tex.outputs["Color"], emit.inputs["Color"])
    nt.links.new(emit.outputs[0], out.inputs["Surface"])
    room.data.materials.clear()
    room.data.materials.append(mat)


def world_to_pixel(cam, point, size):
    """Pixel of a glTF point in a render of this size, as a fraction of it from the bottom left."""
    from bpy_extras.object_utils import world_to_camera_view

    co = world_to_camera_view(bpy.context.scene, cam, P(*point))
    return co.x, co.y


def render_room():
    bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT, "room.blend"))
    room = bpy.data.objects["room.baked"]
    figure = load_avatar()
    root = bpy.data.objects.new("avatar.root", None)
    root.location = P(*SEAT)
    root.rotation_euler = (0, 0, math.pi / 4)
    bpy.context.scene.collection.objects.link(root)
    for o in figure:
        if o.parent is None:
            o.parent = root
    backgrounds = {"day": "#d8d2c6", "night": "#0f1117"}
    for ambiance in AMBIANCES:
        baked_material(room, ambiance)
        setup_render(ambiance, backgrounds[ambiance])
        for label, size in (("phone", PHONE), ("desktop", DESKTOP)):
            aspect = size[0] / size[1]
            half = max(EXTENTS[1], EXTENTS[0] / aspect) * FIT_MARGIN
            cam = camera(tuple(ISO), HOME, 2 * half * aspect, size)
            render(f"room-{label}-{ambiance}")
            if label == "phone":
                # The phone view around the figure, at its real size in pixels.
                fx, fy = world_to_pixel(cam, (SEAT[0], HEAD_Y - 0.25, SEAT[2]), size)
                dx, dy = CROP / size[0], CROP / size[1]
                crop = render(f"phone-crop-{ambiance}", (fx - dx, fy - dy, fx + dx, fy + dy))
                enlarge(crop)
                scale = size[0] / (2 * half * aspect)
                print(f"phone: {scale:.1f} px/m, head about {0.47 * scale:.0f} px high")
    # The chair and the desk, from several sides (quickstart scenario 3).
    baked_material(room, "day")
    setup_render("day", backgrounds["day"])
    target = (SEAT[0], 0.75, SEAT[2] - 0.15)
    for name, direction in (("top", (0, 1, 0.001)), ("east", (1, 0.1, 0)), ("south", (0, 0.1, 1))):
        camera(direction, target, 2.0, (800, 800))
        render(f"chair-{name}")


def main():
    os.makedirs(OUT, exist_ok=True)
    alone = render_alone()
    photo = os.path.join(REPO, "content", "profile-photo.webp")
    sheet([photo, alone["head-front"], alone["head-three-quarter"], alone["head-side"]], "compare-head")
    sheet([alone["front"], alone["three-quarter"], alone["from-camera"]], "compare-body")
    render_room()


if __name__ == "__main__":
    main()
