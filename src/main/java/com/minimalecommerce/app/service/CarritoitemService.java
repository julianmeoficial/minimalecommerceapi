package com.minimalecommerce.app.service;

import com.minimalecommerce.app.model.Carritoitem;
import com.minimalecommerce.app.model.EstadoPedido;
import com.minimalecommerce.app.model.Pedido;
import com.minimalecommerce.app.model.Pedidoitem;
import com.minimalecommerce.app.model.Producto;
import com.minimalecommerce.app.model.Usuario;
import com.minimalecommerce.app.repository.CarritoitemRepository;
import com.minimalecommerce.app.repository.PedidoRepository;
import com.minimalecommerce.app.repository.PedidoitemRepository;
import com.minimalecommerce.app.repository.ProductoRepository;
import com.minimalecommerce.app.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class CarritoitemService {

    @Autowired
    private CarritoitemRepository carritoitemRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private PedidoitemRepository pedidoitemRepository;

    public List<Carritoitem> obtenerCarritoPorUsuario(Long usuarioId) {
        return carritoitemRepository.findByUsuarioId(usuarioId);
    }

    public Carritoitem agregarProductoAlCarrito(Long usuarioId, Long productoId, Integer cantidad) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        if (producto.getStock() < cantidad) {
            throw new RuntimeException("Stock insuficiente. Disponible: " + producto.getStock());
        }

        return carritoitemRepository.findByUsuarioIdAndProductoId(usuarioId, productoId)
                .map(item -> {
                    int nuevaCantidad = item.getCantidad() + cantidad;
                    if (producto.getStock() < nuevaCantidad) {
                        throw new RuntimeException("Stock insuficiente para la cantidad acumulada");
                    }
                    item.setCantidad(nuevaCantidad);
                    return carritoitemRepository.save(item);
                })
                .orElseGet(() -> carritoitemRepository.save(new Carritoitem(usuario, producto, cantidad)));
    }

    public Carritoitem actualizarCantidad(Long itemId, Integer nuevaCantidad) {
        if (nuevaCantidad <= 0) {
            throw new RuntimeException("La cantidad debe ser mayor a 0");
        }
        Carritoitem item = carritoitemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item del carrito no encontrado"));
        if (item.getProducto().getStock() < nuevaCantidad) {
            throw new RuntimeException("Stock insuficiente");
        }
        item.setCantidad(nuevaCantidad);
        return carritoitemRepository.save(item);
    }

    public void eliminarItem(Long itemId) {
        carritoitemRepository.deleteById(itemId);
    }

    public void limpiarCarritoPorUsuario(Long usuarioId) {
        carritoitemRepository.deleteByUsuarioId(usuarioId);
    }

    public Map<String, Object> procesarPedido(Long usuarioId, String direccionEntrega) {
        List<Carritoitem> itemsCarrito = obtenerCarritoPorUsuario(usuarioId);
        if (itemsCarrito.isEmpty()) {
            throw new RuntimeException("El carrito está vacío");
        }

        for (Carritoitem item : itemsCarrito) {
            if (item.getProducto().getStock() < item.getCantidad()) {
                throw new RuntimeException("Stock insuficiente para: " + item.getProducto().getNombre());
            }
        }

        BigDecimal total = itemsCarrito.stream()
                .map(Carritoitem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Pedido pedido = new Pedido();
        pedido.setUsuario(usuario);
        pedido.setFechapedido(LocalDateTime.now());
        pedido.setTotal(total);
        pedido.setEstado(EstadoPedido.PENDIENTE);
        pedido.setDireccionentrega(direccionEntrega);
        Pedido pedidoCreado = pedidoRepository.save(pedido);

        List<Pedidoitem> itemsPedido = new ArrayList<>();
        for (Carritoitem itemCarrito : itemsCarrito) {
            Pedidoitem pedidoItem = new Pedidoitem();
            pedidoItem.setPedido(pedidoCreado);
            pedidoItem.setProducto(itemCarrito.getProducto());
            pedidoItem.setCantidad(itemCarrito.getCantidad());
            pedidoItem.setPreciounitario(itemCarrito.getPreciounitario());
            itemsPedido.add(pedidoitemRepository.save(pedidoItem));

            Producto producto = itemCarrito.getProducto();
            producto.setStock(producto.getStock() - itemCarrito.getCantidad());
            productoRepository.save(producto);
        }

        limpiarCarritoPorUsuario(usuarioId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("pedido", pedidoCreado);
        response.put("items", itemsPedido);
        return response;
    }
}
