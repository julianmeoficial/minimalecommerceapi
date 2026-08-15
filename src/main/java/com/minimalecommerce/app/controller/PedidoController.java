package com.minimalecommerce.app.controller;

import com.minimalecommerce.app.model.EstadoPedido;
import com.minimalecommerce.app.model.Pedido;
import com.minimalecommerce.app.model.Pedidoitem;
import com.minimalecommerce.app.service.PedidoService;
import com.minimalecommerce.app.service.PedidoitemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    @Autowired
    private PedidoService pedidoService;

    @Autowired
    private PedidoitemService pedidoitemService;

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<Map<String, Object>>> obtenerPedidosPorUsuario(@PathVariable Long usuarioId) {
        List<Pedido> pedidos = pedidoService.obtenerPedidosPorUsuario(usuarioId);
        List<Map<String, Object>> resultado = new ArrayList<>();
        for (Pedido pedido : pedidos) {
            Map<String, Object> data = new HashMap<>();
            data.put("pedido", pedido);
            data.put("items", pedidoitemService.obtenerItemsPorPedido(pedido.getId()));
            resultado.add(data);
        }
        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> obtenerPedidoPorId(@PathVariable Long id) {
        return pedidoService.obtenerPedidoPorId(id)
                .map(pedido -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("pedido", pedido);
                    response.put("items", pedidoitemService.obtenerItemsPorPedido(id));
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<Pedido> actualizarEstadoPedido(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        EstadoPedido estado = EstadoPedido.valueOf(request.get("estado").toUpperCase());
        return ResponseEntity.ok(pedidoService.actualizarEstadoPedido(id, estado));
    }

    @PutMapping("/{id}/cancelar")
    public ResponseEntity<Pedido> cancelarPedido(@PathVariable Long id) {
        return ResponseEntity.ok(pedidoService.cancelarPedido(id));
    }
}
