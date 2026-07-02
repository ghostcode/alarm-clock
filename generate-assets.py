"""生成 Chrome 扩展闹钟的图标资源。"""
from PIL import Image, ImageDraw
import math
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ICONS_DIR = os.path.join(BASE_DIR, 'icons')

os.makedirs(ICONS_DIR, exist_ok=True)


def draw_alarm_icon(size):
    """绘制简洁闹钟图标：蓝色圆底 + 白色表盘与指针。"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    bg_color = (56, 189, 248, 255)  # #38bdf8
    margin = max(1, size // 16)
    draw.ellipse(
        [(margin, margin), (size - margin, size - margin)],
        fill=bg_color,
    )

    cx, cy = size // 2, size // 2
    radius = size * 0.32

    tick_color = (15, 23, 42, 180)
    tick_len = max(1, size // 20)
    for i in range(12):
        angle = math.radians(i * 30)
        r_out = radius
        r_in = radius - tick_len
        x1 = cx + r_in * math.cos(angle)
        y1 = cy + r_in * math.sin(angle)
        x2 = cx + r_out * math.cos(angle)
        y2 = cy + r_out * math.sin(angle)
        draw.line([(x1, y1), (x2, y2)], fill=tick_color, width=max(1, size // 40))

    hand_color = (255, 255, 255, 255)
    hour_angle = math.radians(240)
    minute_angle = math.radians(270)
    hour_len = radius * 0.55
    minute_len = radius * 0.75

    hx = cx + hour_len * math.cos(hour_angle)
    hy = cy + hour_len * math.sin(hour_angle)
    mx = cx + minute_len * math.cos(minute_angle)
    my = cy + minute_len * math.sin(minute_angle)

    draw.line([(cx, cy), (hx, hy)], fill=hand_color, width=max(1, size // 18))
    draw.line([(cx, cy), (mx, my)], fill=hand_color, width=max(1, size // 24))

    dot_r = max(1, size // 20)
    draw.ellipse(
        [(cx - dot_r, cy - dot_r), (cx + dot_r, cy + dot_r)],
        fill=(15, 23, 42, 255),
    )

    return img


def generate_icons():
    for size in (16, 32, 48, 128):
        icon = draw_alarm_icon(size)
        icon.save(os.path.join(ICONS_DIR, f'icon{size}.png'), 'PNG')
        print(f'Generated icons/icon{size}.png')


if __name__ == '__main__':
    generate_icons()
