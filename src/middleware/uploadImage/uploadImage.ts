// src/middleware/uploadImage.ts
import { MiddlewareHandler } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

export const uploadImage: MiddlewareHandler = async (c, next) => {
    const body = await c.req.parseBody();
    const image = body['image'];

    if (!image || typeof image === 'string') {
        return c.json({ success: false, message: 'No se envió la imagen' }, 400);
    }

    const buffer = await image.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    const imagePath = join(process.cwd(), 'public', 'images');
    mkdirSync(imagePath, { recursive: true });

    const extension = image.name.split('.').pop();
    const filename = `${uuidv4()}.${extension}`;
    const fullPath = join(imagePath, filename);

    writeFileSync(fullPath, bytes);

    // Guardar ruta pública accesible
    const publicUrl = `/images/${filename}`;
    c.set('imagePath', publicUrl);

    await next();
};
