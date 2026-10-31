# « Tour » room (spec 003, style mockup), after Sébastien's reference renders of 31/10/2026: a
# small, furnished study high up in a tower. A dark wall with a window over the city, a wall of
# lit wooden slats, an L-shaped walnut desk with drawer units (the featured projects on it),
# floating shelves with plants, frames, a large rug, a plant stand and an armchair.
#
# The lighting is baked with Cycles (contracts/scene-ambiance.md, « pièce précalculée »): all the
# static geometry is joined into one mesh, `room.baked`, whose UVs map a day texture and a
# night texture (<room>-day.png / <room>-night.png next to the .glb). The scene code shows them
# unlit and fades between them; the placed objects keep real-time lights.
#
# Loaded by build_models.py (exec into its namespace), which provides Builder, P, matrix,
# empty, room_markers, reset, save and ROOT.
import collections

TOWER_H = 2.1  # half-size of the room (4.2 x 4.2 m)
TOWER_WALL = 2.8  # wall height
TOWER_BAKE_SIZE = 2048
TOWER_BAKE_SAMPLES = 384


# ---------------------------------------------------------------------------------------------
# Materials for the bake: procedural detail (wood grain, rug fibres, paint) ends up in the
# baked textures, so it costs nothing at run time.


def _nodes(mat):
    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return nt, bsdf


def _rgb(hex_):
    c = [int(hex_[i : i + 2], 16) / 255 for i in (1, 3, 5)]
    return [v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c] + [1]


def _ramp(nt, fac, c1, c2):
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = _rgb(c1)
    ramp.color_ramp.elements[1].color = _rgb(c2)
    nt.links.new(fac, ramp.inputs["Fac"])
    return ramp.outputs["Color"]


def mat_plain(name, color, rough=0.6, metal=0.0):
    mat = bpy.data.materials.new(name)
    nt, bsdf = _nodes(mat)
    bsdf.inputs["Base Color"].default_value = _rgb(color)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    mat.diffuse_color = _rgb(color)
    return mat


def mat_noise(name, c1, c2, scale=40.0, rough=0.7, detail=8.0):
    """Paint, concrete, fabric, rug: colour noise between two tones."""
    mat = bpy.data.materials.new(name)
    nt, bsdf = _nodes(mat)
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = scale
    noise.inputs["Detail"].default_value = detail
    nt.links.new(_ramp(nt, noise.outputs["Fac"], c1, c2), bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = rough
    mat.diffuse_color = _rgb(c1)
    return mat


def mat_wood(name, c1, c2, scale=3.0, rough=0.45, along="X"):
    """Wood: wave bands distorted by noise, along an object axis."""
    mat = bpy.data.materials.new(name)
    nt, bsdf = _nodes(mat)
    coord = nt.nodes.new("ShaderNodeTexCoord")
    mapping = nt.nodes.new("ShaderNodeMapping")
    # Stretch the grain along the requested axis.
    stretch = {"X": (0.08, 1, 1), "Y": (1, 0.08, 1), "Z": (1, 1, 0.08)}[along]
    mapping.inputs["Scale"].default_value = stretch
    nt.links.new(coord.outputs["Object"], mapping.inputs["Vector"])
    wave = nt.nodes.new("ShaderNodeTexWave")
    wave.inputs["Scale"].default_value = scale
    wave.inputs["Distortion"].default_value = 6.0
    wave.inputs["Detail"].default_value = 4.0
    nt.links.new(mapping.outputs["Vector"], wave.inputs["Vector"])
    nt.links.new(_ramp(nt, wave.outputs["Fac"], c1, c2), bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = rough
    mat.diffuse_color = _rgb(c1)
    return mat


def mat_emit(name, color, strength, base=None):
    mat = bpy.data.materials.new(name)
    nt, bsdf = _nodes(mat)
    bsdf.inputs["Base Color"].default_value = _rgb(base or color)
    bsdf.inputs["Emission Color"].default_value = _rgb(color)
    bsdf.inputs["Emission Strength"].default_value = strength
    mat.diffuse_color = _rgb(color)
    return mat


def tower_materials():
    """Creates the named materials Builder looks up (it reuses existing ones by name)."""
    for m in list(bpy.data.materials):
        bpy.data.materials.remove(m)
    mat_wood("floor", "#4a2f1f", "#6b4630", scale=2.0, along="X")
    mat_wood("walnut", "#5c3720", "#8a5634", scale=4.0, along="X")
    mat_wood("walnut-z", "#5c3720", "#8a5634", scale=4.0, along="Z")
    mat_wood("slat", "#7a4523", "#a8642f", scale=6.0, along="Z", rough=0.5)
    mat_noise("paint", "#2e3032", "#383a3d", scale=60, rough=0.85)
    mat_plain("cap", "#e8e1d4", rough=0.7)
    mat_plain("frame-white", "#eceae4", rough=0.4)
    mat_noise("rug", "#8c8a86", "#bdbab3", scale=120, rough=0.95, detail=12)
    mat_plain("black", "#17181a", rough=0.45)
    mat_plain("felt", "#1d1e20", rough=0.95)
    mat_plain("metal", "#2a2b2e", rough=0.35, metal=0.9)
    mat_plain("steel", "#8d9096", rough=0.3, metal=1.0)
    mat_noise("fabric", "#3b3a37", "#4a4844", scale=200, rough=0.9)
    mat_noise("leather", "#5a3a28", "#6e4a33", scale=30, rough=0.55)
    mat_noise("leaf", "#2f5a2a", "#4d7f3c", scale=8, rough=0.55)
    mat_noise("leaf-dark", "#22441f", "#355f2c", scale=8, rough=0.55)
    mat_plain("pot", "#d9d4cb", rough=0.6)
    mat_plain("pot-dark", "#26272a", rough=0.6)
    mat_plain("book-a", "#2f4f6b", rough=0.7)
    mat_plain("book-b", "#9a3b2e", rough=0.7)
    mat_plain("book-c", "#d4a64a", rough=0.7)
    mat_plain("book-d", "#e8e4da", rough=0.7)
    mat_plain("poster-a", "#c9452e", rough=0.6)
    mat_plain("poster-b", "#e7dfd0", rough=0.6)
    mat_plain("ceramic", "#efe9df", rough=0.3)
    # Emitters: their strength is set per ambiance before each bake (see AMBIANCES).
    mat_emit("led", "#ffb466", 0.0)
    mat_emit("lampshade", "#ffe2b8", 0.0)
    mat_emit("sky", "#cfe3f5", 0.0, base="#0e1626")  # dark unless it glows (day)
    mat_emit("city-light", "#ffcf8a", 0.0)
    mat_emit("city-neon", "#46e0ff", 0.0)
    mat_noise("city", "#1b2230", "#232c3c", scale=20, rough=0.8)
    mat_noise("cork", "#a97f4f", "#c29a66", scale=90, rough=0.9, detail=10)
    mat_plain("brass", "#b08a4a", rough=0.35, metal=1.0)


# ---------------------------------------------------------------------------------------------
# Geometry. Coordinates follow the contract (glTF): Y up, west wall at x = -H, north wall at
# z = -H, the camera looks from the south-east.


def _plant(b, x, y, z, size=1.0, dark=False, pot="pot"):
    """A potted plant with broad, tilted leaves (monstera-like)."""
    leaf = "leaf-dark" if dark else "leaf"
    b.cylinder(pot, 0.11 * size, 0.2 * size, x, y + 0.1 * size, z, 20, r2=0.085 * size)
    for i in range(7):
        a = i * 2 * math.pi / 7 + 0.4
        r = 0.12 * size
        h = (0.25 + (i % 3) * 0.09) * size
        b.blob(
            leaf, 0.16 * size, 0.012, 0.11 * size,
            x + math.cos(a) * r, y + 0.2 * size + h, z - math.sin(a) * r,
            rot=a, tilt=math.radians(25 + (i % 2) * 15),
        )
        b.cylinder(leaf, 0.006, h, x + math.cos(a) * r * 0.4, y + 0.2 * size + h / 2,
                   z - math.sin(a) * r * 0.4, 5)


def _snake_plant(b, x, y, z, size=1.0):
    b.box("pot-dark", 0.22 * size, 0.28 * size, 0.22 * size, x, y + 0.14 * size, z)
    for i in range(6):
        a = i * 2 * math.pi / 6
        h = (0.45 + (i % 3) * 0.12) * size
        b.blob("leaf-dark", 0.03 * size, h / 2, 0.012, x + math.cos(a) * 0.05 * size,
               y + 0.28 * size + h / 2, z - math.sin(a) * 0.05 * size, rot=a,
               tilt=math.radians(6 * (1 if i % 2 else -1)))


def _books(b, x, y, z0, z1, axis="z", depth=0.18):
    """Upright books along a shelf, from z0 to z1 (or x0 to x1 when axis == 'x')."""
    books = ("book-a", "book-b", "book-c", "book-d")
    p, i = z0, 0
    while p < z1:
        w = 0.035 + (i % 3) * 0.012
        h = 0.2 + ((i * 7) % 5) * 0.02
        if p + w > z1:
            break
        if axis == "z":
            b.box(books[i % 4], depth, h, w, x, y + h / 2, p + w / 2)
        else:
            b.box(books[i % 4], w, h, depth, p + w / 2, y + h / 2, x)
        p += w + 0.006
        i += 1


def build_tower_geometry():
    H, WALL = TOWER_H, TOWER_WALL
    b = Builder(collections.defaultdict(lambda: None))  # materials exist already

    # Floor: a walnut slab with a visible edge, like a diorama base.
    b.box("floor", 2 * H + 0.12, 0.12, 2 * H + 0.12, -0.06, -0.06, -0.06)

    # West wall (dark paint), with the window opening z in [-0.1, 1.3], y in [0.75, 2.45].
    wz0, wz1, wy0, wy1 = -0.25, 1.05, 0.75, 2.45
    wx = -H - 0.06
    b.box("paint", 0.12, WALL, wz0 + H + 0.12, wx, WALL / 2, (-H - 0.12 + wz0) / 2)
    b.box("paint", 0.12, WALL, H - wz1, wx, WALL / 2, (wz1 + H) / 2)
    b.box("paint", 0.12, wy0, wz1 - wz0, wx, wy0 / 2, (wz0 + wz1) / 2)
    b.box("paint", 0.12, WALL - wy1, wz1 - wz0, wx, (wy1 + WALL) / 2, (wz0 + wz1) / 2)
    # North wall (dark paint).
    b.box("paint", 2 * H + 0.12, WALL, 0.12, -0.06, WALL / 2, -H - 0.06)
    # White caps on the cut walls.
    b.box("cap", 0.13, 0.03, 2 * H + 0.13, wx, WALL + 0.015, -0.065)
    b.box("cap", 2 * H + 0.13, 0.03, 0.13, -0.065, WALL + 0.015, -H - 0.06)

    # Window: white frame, sill, a mullion; the city outside on a backdrop just behind the
    # wall (close enough to stay hidden behind it from the camera).
    fx = -H + 0.01
    for z in (wz0, wz1):
        b.box("frame-white", 0.14, wy1 - wy0, 0.05, fx - 0.06, (wy0 + wy1) / 2, z)
    for y in (wy0, wy1):
        b.box("frame-white", 0.14, 0.05, wz1 - wz0 + 0.05, fx - 0.06, y, (wz0 + wz1) / 2)
    b.box("frame-white", 0.05, 0.04, wz1 - wz0, fx - 0.06, 1.75, (wz0 + wz1) / 2)
    b.box("frame-white", 0.05, wy1 - wy0, 0.035, fx - 0.06, (wy0 + wy1) / 2, (wz0 + wz1) / 2)
    b.box("frame-white", 0.24, 0.03, wz1 - wz0 + 0.2, fx + 0.04, wy0 - 0.015, (wz0 + wz1) / 2)
    bx = -H - 0.2
    b.box("sky", 0.01, wy1 - wy0 + 0.4, wz1 - wz0 + 0.4, bx - 0.05, (wy0 + wy1) / 2, (wz0 + wz1) / 2)
    z, i = wz0 - 0.15, 0
    while z < wz1 + 0.15:
        w = 0.12 + (i * 37 % 7) * 0.025
        h = 0.55 + (i * 53 % 9) * 0.11
        top = wy0 - 0.15 + h
        b.box("city", 0.02, h, w, bx - 0.03 + (i % 3) * 0.004, wy0 - 0.15 + h / 2, z + w / 2)
        for row in range(int((h - 0.06) / 0.05)):
            for col in range(max(1, int(w / 0.03))):
                if (i * 5 + row * 3 + col * 7) % 5 < 2:
                    continue
                kind = "city-neon" if (i + row) % 11 == 0 else "city-light"
                b.box(kind, 0.004, 0.018, 0.012, bx - 0.015 + (i % 3) * 0.004,
                      wy0 - 0.12 + row * 0.05, z + 0.012 + col * 0.03)
        z += w + 0.008
        i += 1

    # North wall, west part: wooden slats from floor to ceiling, LED glow at the top and down
    # the right edge.
    sx0, sx1 = -H, 0.25
    k = 0
    x = sx0 + 0.03
    while x < sx1 - 0.02:
        b.box("slat", 0.035, WALL - 0.02, 0.035, x, WALL / 2, -H + 0.035)
        x += 0.07
        k += 1
    b.box("black", sx1 - sx0, WALL, 0.015, (sx0 + sx1) / 2, WALL / 2, -H + 0.008)
    b.box("led", 0.012, WALL - 0.1, 0.012, sx1 + 0.01, WALL / 2, -H + 0.03)
    b.box("led", sx1 - sx0, 0.012, 0.012, (sx0 + sx1) / 2, WALL - 0.04, -H + 0.06)

    # L-shaped walnut desk: north arm along the slats, west arm under the diplomas.
    top, t = 0.77, 0.05
    nz0, nz1 = -H, -H + 0.72
    nx0, nx1 = -H, 0.8
    b.box("walnut", nx1 - nx0, t, nz1 - nz0, (nx0 + nx1) / 2, top - t / 2, (nz0 + nz1) / 2)
    wa_x1, wa_z1 = -H + 0.66, -0.45
    b.box("walnut-z", wa_x1 + H, t, wa_z1 - nz1, (-H + wa_x1) / 2, top - t / 2, (nz1 + wa_z1) / 2)
    b.box("led", nx1 - nx0 - 0.1, 0.01, 0.01, (nx0 + nx1) / 2, top - t - 0.01, nz1 - 0.03)
    # Drawer units (black) under the east end and the west arm's end.
    for cx0, cx1, cz0, cz1 in ((0.27, 0.78, nz0 + 0.02, nz1 - 0.02), (-H + 0.02, wa_x1 - 0.02, wa_z1 - 0.5, wa_z1 - 0.02)):
        b.box("black", cx1 - cx0, top - t - 0.02, cz1 - cz0, (cx0 + cx1) / 2, (top - t - 0.02) / 2, (cz0 + cz1) / 2)
        for d in range(5):
            y = 0.1 + d * 0.13
            if cz1 - cz0 > cx1 - cx0:  # west arm unit: drawers face +X
                b.box("steel", 0.01, 0.015, 0.14, cx1 + 0.005, y + 0.05, (cz0 + cz1) / 2)
                b.box("felt", 0.004, 0.004, cz1 - cz0 - 0.02, cx1 + 0.002, y + 0.12, (cz0 + cz1) / 2)
            else:
                b.box("steel", 0.14, 0.015, 0.01, (cx0 + cx1) / 2, y + 0.05, cz1 + 0.005)
                b.box("felt", cx1 - cx0 - 0.02, 0.004, 0.004, (cx0 + cx1) / 2, y + 0.12, cz1 + 0.002)
    # Black leg frame at the inner corner.
    b.box("metal", 0.05, top - t, 0.05, wa_x1 - 0.06, (top - t) / 2, nz1 - 0.06)
    b.box("metal", 0.05, top - t, 0.05, -0.15, (top - t) / 2, nz1 - 0.06)
    # Desk items: felt mat, keyboard, speakers, a desk lamp on the west arm, a mug, a plant.
    b.box("felt", 1.2, 0.004, 0.42, -0.55, top + 0.002, nz1 - 0.24)
    b.box("black", 0.42, 0.02, 0.13, -0.55, top + 0.014, nz1 - 0.16)
    for sx in (-1.55, 0.62):
        b.box("black", 0.13, 0.22, 0.15, sx, top + 0.11, nz0 + 0.14)
        b.cylinder("metal", 0.035, 0.005, sx, top + 0.15, nz0 + 0.218, 16, tilt=math.radians(90))
    dlx, dlz = -H + 0.2, -0.55
    b.cylinder("metal", 0.07, 0.015, dlx, top + 0.008, dlz - 0.26, 20)
    b.cylinder("metal", 0.008, 0.42, dlx, top + 0.22, dlz - 0.26, 8)
    b.box("metal", 0.008, 0.008, 0.3, dlx, top + 0.43, dlz - 0.13, tilt=math.radians(-20))
    b.cylinder("lampshade", 0.06, 0.08, dlx, top + 0.4, dlz, 16, r2=0.035)
    b.cylinder("ceramic", 0.04, 0.09, 0.1, top + 0.045, nz1 - 0.12, 16)
    _plant(b, -H + 0.2, top, nz0 + 0.18, 0.7, pot="pot-dark")

    # Ergonomic chair at the desk, back to the camera.
    cx, cz = -0.6, -0.95
    b.box("fabric", 0.5, 0.07, 0.48, cx, 0.49, cz)
    b.box("black", 0.48, 0.62, 0.05, cx, 0.95, cz + 0.27, tilt=math.radians(-10))
    b.box("black", 0.3, 0.14, 0.06, cx, 1.36, cz + 0.33, tilt=math.radians(-10))
    for side in (-1, 1):
        b.box("black", 0.05, 0.035, 0.3, cx + side * 0.29, 0.69, cz - 0.02)
        b.box("metal", 0.035, 0.17, 0.035, cx + side * 0.29, 0.6, cz + 0.08)
    b.cylinder("steel", 0.025, 0.36, cx, 0.25, cz, 12)
    for k in range(5):
        a = k * 2 * math.pi / 5 + 0.3
        b.box("metal", 0.3, 0.03, 0.045, cx + math.cos(a) * 0.15, 0.06, cz - math.sin(a) * 0.15, rot=a)
        b.sphere("black", 0.03, cx + math.cos(a) * 0.3, 0.03, cz - math.sin(a) * 0.3)

    # Floating shelf on the slats, with plants and books.
    b.box("walnut", 1.4, 0.035, 0.24, -1.2, 2.0, -H + 0.16)
    _plant(b, -1.7, 2.0175, -H + 0.15, 0.9, dark=True)
    _books(b, -H + 0.16, 2.0175, -1.25, -0.75, axis="x", depth=0.18)
    b.cylinder("ceramic", 0.06, 0.16, -0.62, 2.1, -H + 0.15, 16)

    # North wall, east part: the experience board, a large cork board in a walnut frame under a
    # brass picture lamp (the cards and their red string are placed by the scene); a snake
    # plant on the floor beside it.
    bx0, bx1, by0, by1 = 0.35, 2.05, 1.05, 2.55
    bxc, byc = (bx0 + bx1) / 2, (by0 + by1) / 2
    b.box("walnut", bx1 - bx0 + 0.08, by1 - by0 + 0.08, 0.03, bxc, byc, -H + 0.015)
    b.box("cork", bx1 - bx0, by1 - by0, 0.02, bxc, byc, -H + 0.035)
    b.box("brass", 0.02, 0.02, 0.16, bxc, by1 + 0.12, -H + 0.08)
    b.box("brass", 0.9, 0.04, 0.06, bxc, by1 + 0.12, -H + 0.17)
    b.box("led", 0.86, 0.008, 0.03, bxc, by1 + 0.097, -H + 0.17)
    _snake_plant(b, 1.85, 0, -1.75, 1.1)

    # Large grey rug.
    b.box("rug", 3.3, 0.02, 2.9, 0.05, 0.01, 0.45)

    # Plant stand in the south-west corner, by the window: two walnut shelves on a black frame.
    px0, px1, pz0, pz1 = -H + 0.02, -H + 0.42, 1.2, H - 0.05
    for y in (0.15, 0.62):
        b.box("walnut-z", px1 - px0, 0.03, pz1 - pz0, (px0 + px1) / 2, y, (pz0 + pz1) / 2)
    for x in (px0 + 0.02, px1 - 0.02):
        for z in (pz0 + 0.02, pz1 - 0.02):
            b.box("metal", 0.025, 1.0, 0.025, x, 0.5, z)
    _plant(b, -H + 0.22, 0.165, 1.45, 1.1)
    _plant(b, -H + 0.22, 0.165, 1.85, 0.9, dark=True)
    _plant(b, -H + 0.22, 0.635, 1.42, 1.2)
    _plant(b, -H + 0.22, 0.635, 1.85, 0.8)

    # Leather armchair and a round side table in the south-east corner, facing the desk; a
    # floor lamp beside it.
    ax, az, ar = 1.2, 1.15, -3 * math.pi / 4
    fwd = (math.sin(ar), math.cos(ar))
    side = (math.cos(ar), -math.sin(ar))
    b.box("leather", 0.78, 0.22, 0.72, ax, 0.32, az, rot=ar)
    b.box("leather", 0.66, 0.1, 0.6, ax + fwd[0] * 0.04, 0.47, az + fwd[1] * 0.04, rot=ar)
    b.box("leather", 0.78, 0.5, 0.16, ax - fwd[0] * 0.3, 0.68, az - fwd[1] * 0.3, rot=ar, tilt=math.radians(-12))
    for s in (-1, 1):
        b.box("leather", 0.12, 0.2, 0.7, ax + side[0] * s * 0.36, 0.52, az + side[1] * s * 0.36, rot=ar)
    for s1 in (-1, 1):
        for s2 in (-1, 1):
            b.cylinder("metal", 0.015, 0.21, ax + side[0] * s1 * 0.3 + fwd[0] * s2 * 0.26, 0.105,
                       az + side[1] * s1 * 0.3 + fwd[1] * s2 * 0.26, 8)
    b.cylinder("walnut", 0.24, 0.03, 0.4, 0.52, 1.65, 32)
    b.cylinder("metal", 0.02, 0.5, 0.4, 0.26, 1.65, 8)
    b.cylinder("metal", 0.14, 0.015, 0.4, 0.008, 1.65, 24)
    b.cylinder("ceramic", 0.05, 0.1, 0.45, 0.585, 1.6, 16)
    lx, lz = 1.85, 0.45
    b.cylinder("metal", 0.14, 0.02, lx, 0.01, lz, 24)
    b.cylinder("metal", 0.012, 1.45, lx, 0.735, lz, 8)
    b.cylinder("lampshade", 0.18, 0.28, lx, 1.55, lz, 24, r2=0.15)

    b.build("room")
    return {
        "floor_lamp": (lx, 1.5, lz),
        "desk_lamp": (dlx, top + 0.36, dlz),
        # Picture lamps: over the board, and over each diploma frame (see tower_markers).
        "spot_board": (bxc, by1 + 0.08, -H + 0.25),
        "spot_diploma_1": (-H + 0.25, 2.3, -1.65),
        "spot_diploma_2": (-H + 0.25, 2.3, -0.8),
    }


def tower_markers(lights):
    H = TOWER_H
    top = 0.77
    room_markers(
        lamps=(lights["floor_lamp"], lights["desk_lamp"], lights["spot_board"]),
        # Dedicated objects: LessonFolk's cap on the west arm, this portfolio on the main
        # screen in front of the chair, Voxel Shift's logo on the right.
        featured={
            "lesson-folk": (-H + 0.33, top, -1.12, math.pi / 2),
            "portfolio-3d": (-0.55, top, -H + 0.3, 0.0),
            "voxelshift": (0.45, top, -H + 0.36, 0.0),
        },
        # Another project (none yet) gets a screen on the left of the north arm.
        projects=[(-1.3, top, -H + 0.3, 0.0)],
        # Two large lit frames above the desk's west arm.
        education=[(-H + 0.01, 1.85, z, math.pi / 2) for z in (-1.65, -0.8)],
        # The board: a zigzag timeline, the most recent card (slot 01) on the right.
        experience=[
            (1.82 - i * 0.248, 2.15 if i % 2 == 0 else 1.55, -H + 0.046, 0.0) for i in range(6)
        ],
        neon_lights=(),
    )
    # The camera frames the smaller room (Blender axes: x, depth, up).
    bpy.data.objects["bounds"].scale = (H, H, 1.4)


# ---------------------------------------------------------------------------------------------
# Baking.

AMBIANCES = {
    # world colour and strength, sun (strength, direction), emitter strengths
    "day": {
        "world": ("#cfdcec", 0.9),
        "sun": (3.5, (math.radians(55), 0, math.radians(-110))),
        "emit": {"led": 0.0, "lampshade": 0.0, "sky": 3.5, "city-light": 0.4, "city-neon": 0.5},
        "lights": {},
        "exposure": 0.0,
    },
    "night": {
        "world": ("#16203a", 0.35),
        "sun": None,
        "emit": {"led": 30.0, "lampshade": 6.0, "sky": 0.12, "city-light": 5.0, "city-neon": 7.0},
        "lights": {
            "floor_lamp": 260.0,
            "desk_lamp": 35.0,
            "window": 18.0,
            "fill": 60.0,
            "spot_board": 40.0,
            "spot_diploma_1": 18.0,
            "spot_diploma_2": 18.0,
        },
        "exposure": 0.8,
    },
}


def _join_room():
    objs = [o for o in bpy.data.objects if o.type == "MESH"]
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
        for m in list(o.modifiers):
            bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    room = bpy.context.view_layer.objects.active
    room.name = "room.baked"
    room.data.name = "room.baked"
    # One UV map for the whole room, every face its own room in the atlas.
    while room.data.uv_layers:
        room.data.uv_layers.remove(room.data.uv_layers[0])
    room.data.uv_layers.new(name="bake")
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.002, area_weight=1.0)
    bpy.ops.uv.pack_islands(margin=0.002)
    bpy.ops.object.mode_set(mode="OBJECT")
    return room


def _setup_lights(ambiance, lights):
    for o in [o for o in bpy.data.objects if o.type == "LIGHT"]:
        bpy.data.objects.remove(o)
    cfg = AMBIANCES[ambiance]
    world = bpy.data.worlds.get("bake") or bpy.data.worlds.new("bake")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = _rgb(cfg["world"][0])
    bg.inputs["Strength"].default_value = cfg["world"][1]
    bpy.context.scene.world = world
    bpy.context.scene.view_settings.exposure = cfg["exposure"]
    if cfg["sun"]:
        strength, rot = cfg["sun"]
        data = bpy.data.lights.new("sun", "SUN")
        data.energy = strength
        data.angle = math.radians(4)
        sun = bpy.data.objects.new("sun", data)
        sun.rotation_euler = rot
        bpy.context.scene.collection.objects.link(sun)
    for key, power in cfg["lights"].items():
        if key == "fill":
            # Soft warm light from above the room, as if bounced off a ceiling.
            data = bpy.data.lights.new("fill", "AREA")
            data.shape = "SQUARE"
            data.size = 2.5
            data.color = _rgb("#ffd2a0")[:3]
            data.energy = power
            light = bpy.data.objects.new("fill", data)
            light.location = P(0, TOWER_WALL - 0.05, 0)
        elif key == "window":
            data = bpy.data.lights.new("window", "AREA")
            data.shape = "RECTANGLE"
            data.size, data.size_y = 1.4, 1.7
            data.color = _rgb("#7d9cff")[:3]
            data.energy = power
            light = bpy.data.objects.new("window", data)
            light.location = P(-TOWER_H + 0.05, 1.6, 0.4)
            light.rotation_euler = (0, math.radians(-90), 0)  # facing the room (+X)
        elif key.startswith("spot"):
            # Picture lamp: a small warm area light pointing down at the wall below it.
            data = bpy.data.lights.new(key, "AREA")
            data.shape = "RECTANGLE"
            data.size, data.size_y = 0.5, 0.08
            data.color = _rgb("#ffcf94")[:3]
            data.energy = power
            light = bpy.data.objects.new(key, data)
            light.location = P(*lights[key])
            if "diploma" in key:
                light.rotation_euler = (0, 0, math.radians(90))
        else:
            data = bpy.data.lights.new(key, "POINT")
            data.color = _rgb("#ffc98a")[:3]
            data.energy = power
            data.shadow_soft_size = 0.08
            light = bpy.data.objects.new(key, data)
            light.location = P(*lights[key])
        bpy.context.scene.collection.objects.link(light)
    for name, strength in cfg["emit"].items():
        mat = bpy.data.materials[name]
        bsdf = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
        bsdf.inputs["Emission Strength"].default_value = strength


def _bake(room, ambiance, out, name):
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "GPU"
    scene.cycles.samples = TOWER_BAKE_SAMPLES
    scene.render.bake.margin = 6
    scene.render.bake.use_clear = True
    scene.view_settings.view_transform = "AgX"
    img_name = f"{name}-{ambiance}"
    if img_name in bpy.data.images:
        bpy.data.images.remove(bpy.data.images[img_name])
    img = bpy.data.images.new(img_name, TOWER_BAKE_SIZE, TOWER_BAKE_SIZE, float_buffer=True)
    # Every material gets an active image node pointing at the bake target.
    for slot in room.material_slots:
        nt = slot.material.node_tree
        node = nt.nodes.get("bake-target") or nt.nodes.new("ShaderNodeTexImage")
        node.name = "bake-target"
        node.image = img
        nt.nodes.active = node
    bpy.ops.object.select_all(action="DESELECT")
    room.select_set(True)
    bpy.context.view_layer.objects.active = room
    bpy.ops.object.bake(type="COMBINED")
    # Save through the scene's view transform, as an 8-bit sRGB PNG.
    path = os.path.join(out, f"{img_name}.png")
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_depth = "8"
    img.save_render(path, scene=scene)
    return path


def build_tower_room_baked(out=None, bake=True):
    """Builds, bakes (day and night) and exports the « tour » room as room-tour.glb plus
    room-tour-day.png and room-tour-night.png in `out`."""
    out = out or ROOT
    reset()
    tower_materials()
    lights = build_tower_geometry()
    room = _join_room()
    paths = []
    if bake:
        for ambiance in ("day", "night"):
            _setup_lights(ambiance, lights)
            paths.append(_bake(room, ambiance, out, "room-tour"))
    for o in [o for o in bpy.data.objects if o.type == "LIGHT"]:
        bpy.data.objects.remove(o)
    # The export carries one plain material: the scene code replaces it with the baked maps.
    baked = bpy.data.materials.new("baked")
    room.data.materials.clear()
    room.data.materials.append(baked)
    tower_markers(lights)
    save("room-tour", out)
    return paths


# ---------------------------------------------------------------------------------------------
# The room's objects, placed by the scene at the slots: lit diploma frames, experience cards,
# and the dedicated objects of LessonFolk (a graduation cap) and Voxel Shift (its logo). They
# keep real-time materials; the scene reads the names label, pin, lamp, neon and glow.


def tower_object_materials():
    for m in list(bpy.data.materials):
        bpy.data.materials.remove(m)
    mat_plain("frame-dark", "#3a2416", rough=0.4)
    mat_plain("mat", "#f4f1ea", rough=0.8)
    mat_plain("label", "#fbf8f1", rough=0.8)
    mat_plain("gold", "#c9a227", rough=0.3, metal=1.0)
    mat_plain("brass", "#b08a4a", rough=0.35, metal=1.0)
    mat_plain("lamp", "#ffe2b8", rough=0.4)
    mat_plain("glow", "#ffffff", rough=1.0)
    mat_plain("paper", "#fffdf6", rough=0.9)
    mat_plain("pin", "#c0392b", rough=0.4)
    mat_plain("cap", "#1b1b1f", rough=0.8)
    mat_plain("tassel", "#f2c230", rough=0.6)
    mat_plain("book-purple", "#5b4cf0", rough=0.7)
    mat_plain("book-cream", "#efe6d2", rough=0.7)
    mat_plain("base", "#141518", rough=0.4)
    mat_plain("neon", "#00a352", rough=0.4)  # darker than the logo's green; glows brighter
    mat_plain("screen", "#e8eaf6", rough=0.4)
    mat_plain("bezel", "#16171a", rough=0.5)
    mat_plain("stand", "#5a5d63", rough=0.35, metal=1.0)


def _capsule(b, material, x0, y0, x1, y1, w, depth, z=0.0):
    """A stroke with rounded ends from (x0, y0) to (x1, y1), in the plane facing +Z."""
    length = math.hypot(x1 - x0, y1 - y0)
    angle = math.atan2(y1 - y0, x1 - x0)
    # In Blender axes the facing plane is X / Z: turn about Y (negative turns X towards up).
    m = (
        Matrix.Translation(P((x0 + x1) / 2, (y0 + y1) / 2, z))
        @ Matrix.Rotation(-angle, 4, "Y")
        @ Matrix.Diagonal((length, depth, w, 1))
    )
    bmesh.ops.create_cube(b._bm(material), size=1, matrix=m)
    for x, y in ((x0, y0), (x1, y1)):
        b.cylinder(material, w / 2, depth, x, y, z, 16, tilt=math.radians(90))


def build_tower_education():
    b = Builder(collections.defaultdict(lambda: None))
    b.box("frame-dark", 0.8, 0.6, 0.04, 0, 0, 0.02)
    b.box("mat", 0.72, 0.52, 0.01, 0, 0, 0.045)
    b.plane("label", 0.56, 0.38, 0, 0, 0.051)
    b.cylinder("gold", 0.035, 0.006, 0.22, -0.15, 0.053, 24, tilt=math.radians(90))
    # Picture lamp above the frame, and its halo on the frame (lit at night by the scene).
    b.box("brass", 0.02, 0.02, 0.12, 0, 0.36, 0.06)
    b.box("brass", 0.46, 0.035, 0.05, 0, 0.36, 0.13)
    b.box("lamp", 0.42, 0.008, 0.03, 0, 0.34, 0.13)
    b.plane("glow", 0.86, 0.66, 0, 0.02, 0.058)
    b.build("generic-education", flat=("label", "glow"))


def build_tower_experience():
    b = Builder(collections.defaultdict(lambda: None))
    b.box("paper", 0.3, 0.2, 0.003, 0, 0, 0.0015)
    b.plane("label", 0.28, 0.18, 0, -0.005, 0.0035)
    b.sphere("pin", 0.012, 0, 0.08, 0.012)
    b.build("generic-experience", bevel=0, flat=("label",))


def build_tower_lesson_folk():
    """LessonFolk: a graduation cap on two books in the project's colours."""
    b = Builder(collections.defaultdict(lambda: None))
    b.box("book-purple", 0.3, 0.05, 0.22, 0, 0.025, 0)
    b.box("book-cream", 0.27, 0.045, 0.2, 0.01, 0.0725, 0.005, rot=math.radians(6))
    b.cylinder("cap", 0.1, 0.07, 0, 0.13, 0, 24, r2=0.105)
    turn = math.radians(20)
    b.box("cap", 0.32, 0.014, 0.32, 0, 0.172, 0, rot=turn)
    b.cylinder("tassel", 0.016, 0.012, 0, 0.185, 0, 12)
    # Cord from the button to the front corner, tassel hanging over the edge.
    cx = 0.152 * (math.cos(turn) + math.sin(turn))
    cz = 0.152 * (math.cos(turn) - math.sin(turn))
    b.box("tassel", math.hypot(cx, cz), 0.006, 0.008, cx / 2, 0.181, cz / 2, rot=math.atan2(cz, cx))
    b.cylinder("tassel", 0.004, 0.06, cx, 0.15, cz, 6)
    b.cylinder("tassel", 0.014, 0.07, cx, 0.09, cz, 12, r2=0.008)
    b.build("lesson-folk", bevel=0.003)


def build_tower_voxelshift():
    """Voxel Shift: its logo (a green V and three speed lines) on a black stand; the logo uses
    the `neon` material, so it glows a little by day and more at night."""
    b = Builder(collections.defaultdict(lambda: None))
    b.box("base", 0.36, 0.03, 0.1, 0, 0.015, 0)
    s = 0.3 / 256  # the logo drawn on a 256 px grid, y downwards (src-tauri/icons/VSLogo.svg)
    w = 24 * s
    pt = lambda px, py: (-0.15 + px * s, 0.03 + w / 2 + (235 - py) * s)
    v = (pt(45, 20), pt(160, 235), pt(230, 20))
    _capsule(b, "neon", *v[0], *v[1], w, 0.03)
    _capsule(b, "neon", *v[1], *v[2], w, 0.03)
    for py, px1 in ((145, 75), (185, 98), (218, 120)):
        _capsule(b, "neon", *pt(15, py), *pt(px1, py), w * 0.95, 0.03)
    b.build("voxelshift", bevel=0.002)


def build_tower_monitor(name):
    """A slim 27" monitor on a metal stand; its screen shows the project's image (`screen`)."""
    b = Builder(collections.defaultdict(lambda: None))
    w, h, y = 0.64, 0.37, 0.42
    b.box("bezel", w + 0.02, h + 0.02, 0.02, 0, y, 0)
    b.plane("screen", w, h, 0, y, 0.0105)
    b.box("bezel", 0.2, 0.12, 0.03, 0, y - 0.02, -0.025)
    b.box("stand", 0.04, 0.3, 0.025, 0, 0.17, -0.06, tilt=math.radians(-6))
    b.box("stand", 0.24, 0.012, 0.16, 0, 0.006, -0.04)
    b.build(name, flat=("screen",))


# Model file -> builder and scale: the desk objects are drawn larger than life so they read
# from the isometric view.
TOWER_OBJECTS = {
    "tour/generic-education": (build_tower_education, 1.0),
    "tour/generic-experience": (build_tower_experience, 1.0),
    "tour/generic-project": (lambda: build_tower_monitor("generic-project"), 1.0),
    "tour/featured/lesson-folk": (build_tower_lesson_folk, 1.5),
    "tour/featured/voxelshift": (build_tower_voxelshift, 1.4),
    # This portfolio: the main computer's screen, showing the site.
    "tour/featured/portfolio-3d": (lambda: build_tower_monitor("portfolio-3d"), 1.1),
}


def build_tower_objects(out=None):
    for name, (build, scale) in TOWER_OBJECTS.items():
        reset()
        tower_object_materials()
        build()
        for o in bpy.data.objects:
            o.scale = (scale, scale, scale)
        save(name, out or ROOT)
