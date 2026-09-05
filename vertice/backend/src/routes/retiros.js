import express from 'express';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';

const router = express.Router();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

router.post('/api/retiros/generar', async (req, res) => {
    try {
        const { id_estudiante, id_apoderado, id_persona_autorizada } = req.body;

       
        if (!id_estudiante || !id_apoderado) {
            return res.status(400).json({ error: 'Faltan parámetros obligatorios.' });
        }

        
        const { data, error } = await supabase.rpc('generar_codigo_qr', {
            p_id_estudiante: id_estudiante,
            p_id_apoderado: id_apoderado,
            p_id_persona_autorizada: id_persona_autorizada || null
        });

        if (error) {
            console.error("Error Supabase:", error);
            return res.status(500).json({ error: error.message });
        }

        const nuevoRetiro = data[0]; 

    
        const qrImagenBase64 = await QRCode.toDataURL(nuevoRetiro.codigo_qr);

       
        return res.status(200).json({
            success: true,
            datos_retiro: nuevoRetiro,
            qr_image: qrImagenBase64 
        });

    } catch (err) {
        return res.status(500).json({ error: 'Error interno del servidor: ' + err.message });
    }
});

export default router;