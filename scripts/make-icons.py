from PIL import Image, ImageDraw, ImageFont

FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'

def gradient(size):
    img = Image.new('RGB', (size, size))
    px = img.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * size)
            px[x, y] = (int(0x8f + (0xff - 0x8f) * t * 0.9), int(0x73 + (0x5c - 0x73) * t), int(0xff + (0x7a - 0xff) * t))
    return img

def icon(size, rounded):
    img = gradient(size)
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT, int(size * 0.46))
    draw.text((size / 2, size * 0.52), 'S?', font=font, fill='#ffd23f', anchor='mm')
    if rounded:
        mask = Image.new('L', (size, size), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, size, size), radius=int(size * 0.22), fill=255)
        out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        out.paste(img, mask=mask)
        return out
    return img

icon(192, True).save('public/pwa-192x192.png')
icon(512, True).save('public/pwa-512x512.png')
icon(512, False).save('public/pwa-maskable-512x512.png')
icon(180, False).save('public/apple-touch-icon.png')
