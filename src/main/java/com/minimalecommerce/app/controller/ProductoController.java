package com.minimalecommerce.app.controller;

import com.minimalecommerce.app.model.Producto;
import com.minimalecommerce.app.service.ProductoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/productos")
public class ProductoController {

    @Autowired
    private ProductoService productoService;

    @GetMapping
    public ResponseEntity<List<Producto>> obtenerTodosProductos() {
        return ResponseEntity.ok(productoService.obtenerProductosActivos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Producto> obtenerProductoPorId(@PathVariable Long id) {
        return productoService.obtenerPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/categoria/{categoriaId}")
    public ResponseEntity<List<Producto>> obtenerProductosPorCategoria(@PathVariable Long categoriaId) {
        return ResponseEntity.ok(productoService.obtenerProductosPorCategoria(categoriaId));
    }

    @GetMapping("/disponibles")
    public ResponseEntity<List<Producto>> obtenerProductosDisponibles() {
        return ResponseEntity.ok(productoService.obtenerProductosDisponibles());
    }

    @GetMapping("/vendedor/{vendedorId}")
    public ResponseEntity<List<Producto>> obtenerProductosPorVendedor(@PathVariable Long vendedorId) {
        return ResponseEntity.ok(productoService.obtenerProductosPorVendedor(vendedorId));
    }

    @GetMapping("/buscar/{nombre}")
    public ResponseEntity<List<Producto>> buscarProductos(@PathVariable String nombre) {
        return ResponseEntity.ok(productoService.buscarProductos(nombre));
    }

    @PostMapping
    public ResponseEntity<Producto> crearProducto(@RequestBody Producto producto) {
        return ResponseEntity.ok(productoService.crearProducto(producto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Producto> actualizarProducto(@PathVariable Long id, @RequestBody Producto producto) {
        return ResponseEntity.ok(productoService.actualizarProducto(id, producto));
    }

    @PutMapping("/{id}/stock")
    public ResponseEntity<Map<String, String>> actualizarStock(
            @PathVariable Long id,
            @RequestParam Integer nuevoStock) {
        productoService.actualizarStock(id, nuevoStock);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Stock actualizado");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> desactivarProducto(@PathVariable Long id) {
        productoService.desactivarProducto(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Producto desactivado");
        return ResponseEntity.ok(response);
    }
}
