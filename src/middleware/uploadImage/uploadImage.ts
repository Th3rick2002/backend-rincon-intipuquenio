import { MiddlewareHandler } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Tipos de imagen permitidos
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const uploadImage: MiddlewareHandler = async (c, next) => {
    try {
        const body = await c.req.parseBody();
        const image = body['image'];

        // Si no hay imagen, continuar (puede ser opcional en updates)
        if (!image || typeof image === 'string') {
            await next();
            return;
        }

        // Validar tipo de archivo
        if (!ALLOWED_TYPES.includes(image.type)) {
            return c.json({
                success: false,
                message: 'Tipo de archivo no permitido. Solo se permiten: JPG, JPEG, PNG, WEBP'
            }, 400);
        }

        // Validar tamaño
        if (image.size > MAX_SIZE) {
            return c.json({
                success: false,
                message: 'El archivo es demasiado grande. Máximo 5MB'
            }, 400);
        }

        // Crear directorio si no existe
        const imagesDir = join(process.cwd(), 'public', 'images');
        if (!existsSync(imagesDir)) {
            mkdirSync(imagesDir, { recursive: true });
        }

        // Generar nombre único
        const extension = image.name.split('.').pop()?.toLowerCase() || 'jpg';
        const filename = `${uuidv4()}.${extension}`;
        const fullPath = join(imagesDir, filename);

        // Convertir a buffer y guardar
        const buffer = await image.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        writeFileSync(fullPath, bytes);

        // Guardar ruta pública accesible
        const publicUrl = `/images/${filename}`;
        c.set('imagePath', publicUrl);

        await next();
    } catch (error) {
        console.error('Error en uploadImage:', error);
        return c.json({
            success: false,
            message: 'Error al procesar la imagen'
        }, 500);
    }
};