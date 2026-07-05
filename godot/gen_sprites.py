#!/usr/bin/env python3
"""Generate pixel art sprites for the Godot version of Whack the Penguin."""
from PIL import Image
import os

OUT = "sprites"
os.makedirs(OUT, exist_ok=True)

# Colors (RGB)
C = {
    "black": (26, 26, 46),
    "white": (240, 240, 240),
    "beak": (255, 140, 0),
    "eye_white": (255, 255, 255),
    "pupil": (0, 0, 0),
    "yeti_body": (208, 208, 208),
    "yeti_light": (224, 224, 224),
    "yeti_dark": (180, 180, 180),
    "eye": (34, 34, 34),
    "club": (139, 69, 19),
    "club_dark": (107, 52, 16),
    "rock": (139, 115, 85),
    "rock_dark": (122, 99, 72),
    "snow": (244, 244, 244),
    "ice": (200, 232, 248),
    "mountain_back": (200, 220, 232),
    "mountain_front": (216, 232, 240),
    "gold": (255, 215, 0),
    "red": (231, 76, 60),
    "green": (46, 204, 113),
    "bg": (135, 206, 235),
}


def mk(w, h, pixels, scale=1):
    """Create image from pixel grid. Each char maps to a color."""
    img = Image.new("RGBA", (w * scale, h * scale), (0, 0, 0, 0))
    for y, row in enumerate(pixels):
        for x, ch in enumerate(row):
            if ch == " " or ch == ".":
                continue
            color = C.get(ch, ("#",))
            if isinstance(color, str):
                continue
            color = color + (255,)
            for sy in range(scale):
                for sx in range(scale):
                    img.putpixel((x * scale + sx, y * scale + sy), color)
    return img


# ---- PENGUIN (16x24) ----
penguin_pixels = [
    "            ",
    "            ",
    "   @@@@     ",
    "  @@@@@@    ",
    "  @WW@@W@   ",   # eyes (W=white, p=pupil)
    "  @pp@@p@   ",
    "  @@@@BB@   ",   # beak
    "  @@@@@@@   ",
    "   @@@@@@   ",
    "  aa@@@@aa  ",   # flippers (a=arm)
    " aaa@@@@aaa ",
    "  aa@@@@aa  ",
    "   @@@@@@   ",
    "   @@@@@@   ",
    "   @@@@@@   ",
    "   @@@@@@   ",
    "  @@  @@    ",   # feet gap
    "  ff  ff    ",   # feet (f=feet)
    "  ff  ff    ",
]

# Override chars for penguin
def mk_penguin():
    w, h = 16, 20
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    body = C["black"] + (255,)
    white = C["white"] + (255,)
    beak = C["beak"] + (255,)
    eye_w = C["eye_white"] + (255,)
    pup = C["pupil"] + (255,)
    foot = (180, 100, 50, 255)

    for y, row in enumerate(penguin_pixels):
        for x, ch in enumerate(row):
            if ch == " ":
                continue
            c = None
            if ch in ("@"):
                c = body
            elif ch == "W":
                c = eye_w
            elif ch == "p":
                c = pup
            elif ch == "B":
                c = beak
            elif ch == "a":
                c = body  # flippers same as body
            elif ch == "f":
                c = foot
            if c:
                img.putpixel((x, y), c)
    return img


# ---- YETI (20x24) ----
def mk_yeti():
    w, h = 20, 24
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    body = C["yeti_body"] + (255,)
    light = C["yeti_light"] + (255,)
    dark = C["yeti_dark"] + (255,)
    eye_w = C["eye_white"] + (255,)
    pup = C["eye"] + (255,)
    brow = C["yeti_dark"] + (255,)
    mouth = (80, 80, 80, 255)
    foot = (136, 136, 136, 255)
    club = C["club"] + (255,)
    club_d = C["club_dark"] + (255,)

    # Body (torso)
    for y in range(8, 20):
        for x in range(6, 14):
            img.putpixel((x, y), body)

    # Head
    for y in range(2, 9):
        for x in range(5, 15):
            if y == 2 and x in (5, 14):
                continue
            if y == 3 and x == 5:
                continue
            img.putpixel((x, y), light)

    # Fur on top
    for x in range(4, 16):
        img.putpixel((x, 1), dark)

    # Eyes
    for x in range(7, 10):
        img.putpixel((x, 5), eye_w)
    for x in range(11, 14):
        img.putpixel((x, 5), eye_w)

    # Pupils
    img.putpixel((8, 5), pup)
    img.putpixel((12, 5), pup)

    # Brows
    for x in range(7, 10):
        img.putpixel((x, 4), brow)
    for x in range(11, 14):
        img.putpixel((x, 4), brow)

    # Mouth
    for x in range(8, 12):
        img.putpixel((x, 7), mouth)

    # Legs
    for y in range(19, 23):
        for x in range(7, 9):
            img.putpixel((x, y), body)
        for x in range(11, 13):
            img.putpixel((x, y), body)

    # Feet
    for x in range(6, 10):
        img.putpixel((x, 23), foot)
    for x in range(10, 14):
        img.putpixel((x, 23), foot)

    # Club arm (right arm holding club)
    arm_x, arm_y = 14, 10
    for dy in range(6):
        img.putpixel((arm_x, arm_y + dy), body)
        if dy < 2:
            img.putpixel((arm_x + 1, arm_y + dy), club_d)
        elif dy < 4:
            img.putpixel((arm_x + 1, arm_y + dy), club)
        else:
            img.putpixel((arm_x + 1, arm_y + dy), club_d)

    return img


# ---- CLUB (separate for animation, 6x14) ----
def mk_club():
    w, h = 6, 14
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    club = C["club"] + (255,)
    club_d = C["club_dark"] + (255,)

    # Handle
    for y in range(4, 10):
        for x in range(2, 4):
            img.putpixel((x, y), club)

    # Club head (top)
    for y in range(2, 6):
        for x in range(1, 5):
            if y == 2 and x in (1, 4):
                continue
            img.putpixel((x, y), club_d)

    # Knob on top
    for x in range(2, 4):
        img.putpixel((x, 1), club)

    # Bands
    for x in range(1, 5):
        img.putpixel((x, 5), club)

    return img


# ---- TERRAIN TILE (32x8) ----
def mk_terrain():
    w, h = 32, 8
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    snow = C["snow"] + (255,)
    snow_d = (220, 224, 232, 255)

    for x in range(w):
        for y in range(h):
            # Snow surface with slight undulation
            surface_y = 2 + (x % 4)
            if y >= surface_y:
                c = snow_d if ((x + y) % 5 == 0) else snow
                img.putpixel((x, y), c)
            elif y == surface_y - 1 and x % 6 < 2:
                img.putpixel((x, y), snow)  # snow bumps

    return img


# ---- CLIFF (24x20) ----
def mk_cliff():
    w, h = 24, 20
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    rock = C["rock"] + (255,)
    rock_d = C["rock_dark"] + (255,)
    snow = C["snow"] + (255,)
    ice = C["ice"] + (255,)

    # Rock face
    for y in range(4, h):
        for x in range(w):
            if x >= 20 and y >= 6:
                continue  # ledge cutout
            c = rock_d if ((x + y) % 4 == 0) else rock
            img.putpixel((x, y), c)

    # Snow cap
    for y in range(2, 5):
        for x in range(2, 22):
            if y == 2 and x in (2, 21):
                continue
            img.putpixel((x, y), snow)

    # Ledge surface
    for x in range(18, 24):
        for y in range(4, 7):
            img.putpixel((x, y), rock)

    # Snow on ledge
    for x in range(18, 24):
        img.putpixel((x, 4), snow)

    # Icicles
    for x in range(18, 22):
        h_ice = 2 + ((x - 18) % 3)
        for dy in range(h_ice):
            img.putpixel((x, 7 + dy), ice)

    return img


# ---- MOUNTAIN (16x20) ----
def mk_mountain(color):
    w, h = 16, 20
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    body = color + (255,)
    snow = C["snow"] + (255,)

    for y in range(h):
        row_width = int((y / h) * w / 2)
        for x in range(max(0, w // 2 - row_width), min(w, w // 2 + row_width)):
            if y < 5:
                img.putpixel((x, y), snow)
            else:
                img.putpixel((x, y), body)

    return img


# ---- DISTANCE MARKER (6x14) ----
def mk_marker():
    w, h = 6, 14
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    post = C["club"] + (255,)
    gold = C["gold"] + (255,)

    # Post
    for y in range(2, h):
        for x in range(2, 4):
            img.putpixel((x, y), post)

    # Flag
    for y in range(0, 3):
        for x in range(3, 6):
            img.putpixel((x, y), gold)

    return img


# ---- SNOWFLAKE (4x4) ----
def mk_snowflake():
    img = Image.new("RGBA", (4, 4), (0, 0, 0, 0))
    white = C["white"] + (255,)
    for y in range(4):
        for x in range(4):
            d = ((x - 1.5) ** 2 + (y - 1.5) ** 2)
            if d < 2:
                a = max(0, 255 - int(d * 80))
                img.putpixel((x, y), white[:3] + (a,))
    return img


# ---- BG SKY GRADIENT (1200x600) ----
def mk_sky():
    img = Image.new("RGB", (1200, 600))
    top = (100, 160, 210)
    bot = C["bg"]
    for y in range(600):
        r = int(top[0] + (bot[0] - top[0]) * y / 599)
        g = int(top[1] + (bot[1] - top[1]) * y / 599)
        b = int(top[2] + (bot[2] - top[2]) * y / 599)
        for x in range(1200):
            img.putpixel((x, y), (r, g, b))
    return img


if __name__ == "__main__":
    sprites = {
        "penguin.png": mk_penguin(),
        "yeti.png": mk_yeti(),
        "club.png": mk_club(),
        "terrain.png": mk_terrain(),
        "cliff.png": mk_cliff(),
        "mountain_back.png": mk_mountain(C["mountain_back"]),
        "mountain_front.png": mk_mountain(C["mountain_front"]),
        "marker.png": mk_marker(),
        "snowflake.png": mk_snowflake(),
        "sky.png": mk_sky(),
    }

    for name, img in sprites.items():
        path = os.path.join(OUT, name)
        img.save(path)
        print(f"  {path} ({img.size[0]}x{img.size[1]})")

    print(f"Done. {len(sprites)} sprites generated.")
