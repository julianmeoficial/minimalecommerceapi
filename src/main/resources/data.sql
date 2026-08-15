-- Seed de guía (ejecutar a mano en MySQL). No se aplica al arrancar.
INSERT INTO categoria (nombre, descripcion)
SELECT * FROM (
    SELECT 'Tecnologia' as nombre, 'Productos tecnológicos' as descripcion
    UNION SELECT 'Hogar', 'Artículos para el hogar'
    UNION SELECT 'Moda', 'Ropa y accesorios'
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM categoria LIMIT 1);

INSERT INTO usuario (nombre, email, password, telefono, direccion, fecharegistro, activo, tipousuario)
SELECT * FROM (
    SELECT 'Comprador Demo' as nombre, 'comprador@minimalecommerce.com' as email, 'password123' as password,
           '555-0123' as telefono, 'Calle Principal 123' as direccion, NOW() as fecharegistro, true as activo, 'COMPRADOR' as tipousuario
    UNION SELECT 'Vendedor Demo', 'vendedor@minimalecommerce.com', 'password123',
           '555-0456', 'Avenida Comercial 456', NOW(), true, 'VENDEDOR'
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM usuario LIMIT 1);
