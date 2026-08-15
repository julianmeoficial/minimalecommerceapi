package com.minimalecommerce.app.controller;

import com.minimalecommerce.app.model.Carritoitem;
import com.minimalecommerce.app.service.CarritoitemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/carrito")
public class CarritoitemController {

    @Autowired
    private CarritoitemService carritoitemService;

    @PostMapping("/agregar")
    public ResponseEntity<Map<String, Object>> agregarProducto(@RequestBody Map<String, Object> request) {
        Long usuarioId = Long.valueOf(request.get("usuarioId").toString());
        Long productoId = Long.valueOf(request.get("productoId").toString());
        Integer cantidad = Integer.valueOf(request.get("cantidad").toString());

        Carritoitem item = carritoitemService.agregarProductoAlCarrito(usuarioId, productoId, cantidad);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("item", item);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<Carritoitem>> obtenerCarritoPorUsuario(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(carritoitemService.obtenerCarritoPorUsuario(usuarioId));
    }

    @PutMapping("/actualizar-cantidad")
    public ResponseEntity<Carritoitem> actualizarCantidad(@RequestBody Map<String, Object> request) {
        Long itemId = Long.valueOf(request.get("itemId").toString());
        Integer cantidad = Integer.valueOf(request.get("cantidad").toString());
        return ResponseEntity.ok(carritoitemService.actualizarCantidad(itemId, cantidad));
    }

    @DeleteMapping("/eliminar/{itemId}")
    public ResponseEntity<Map<String, String>> eliminarItem(@PathVariable Long itemId) {
        carritoitemService.eliminarItem(itemId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Item eliminado");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/limpiar/{usuarioId}")
    public ResponseEntity<Map<String, String>> limpiarCarrito(@PathVariable Long usuarioId) {
        carritoitemService.limpiarCarritoPorUsuario(usuarioId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Carrito vaciado");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/procesar-pedido")
    public ResponseEntity<Map<String, Object>> procesarPedido(@RequestBody Map<String, Object> request) {
        Long usuarioId = Long.valueOf(request.get("usuarioId").toString());
        String direccionEntrega = request.get("direccionEntrega").toString();
        return ResponseEntity.ok(carritoitemService.procesarPedido(usuarioId, direccionEntrega));
    }
}
