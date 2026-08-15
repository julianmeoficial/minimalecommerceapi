package com.minimalecommerce.app.service;

import com.minimalecommerce.app.model.Categoria;
import com.minimalecommerce.app.model.Producto;
import com.minimalecommerce.app.repository.CategoriaRepository;
import com.minimalecommerce.app.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ProductoService {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private CategoriaRepository categoriaRepository;

    public List<Producto> obtenerProductosActivos() {
        return productoRepository.findByActivoTrue();
    }

    public Optional<Producto> obtenerPorId(Long id) {
        return productoRepository.findById(id);
    }

    public List<Producto> obtenerProductosPorCategoria(Long categoriaId) {
        return productoRepository.findByCategoriaIdAndStockDisponible(categoriaId);
    }

    public List<Producto> obtenerProductosDisponibles() {
        return productoRepository.findProductosDisponibles();
    }

    public List<Producto> obtenerProductosPorVendedor(Long vendedorId) {
        return productoRepository.findByVendedorId(vendedorId);
    }

    public List<Producto> buscarProductos(String nombre) {
        return productoRepository.findByNombreContainingIgnoreCase(nombre);
    }

    public Producto crearProducto(Producto producto) {
        if (producto.getCategoria() == null || producto.getCategoria().getId() == null) {
            throw new RuntimeException("Debe especificar una categoría válida");
        }
        if (producto.getVendedor() == null || producto.getVendedor().getId() == null) {
            throw new RuntimeException("Debe especificar un vendedor válido");
        }

        Optional<Categoria> categoria = categoriaRepository.findById(producto.getCategoria().getId());
        if (categoria.isEmpty()) {
            throw new RuntimeException("Categoría no encontrada");
        }

        producto.setCategoria(categoria.get());
        producto.setActivo(true);
        return productoRepository.save(producto);
    }

    public Producto actualizarProducto(Long id, Producto producto) {
        if (!productoRepository.existsById(id)) {
            throw new RuntimeException("Producto no encontrado");
        }
        producto.setId(id);
        return productoRepository.save(producto);
    }

    public void desactivarProducto(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        producto.setActivo(false);
        productoRepository.save(producto);
    }

    public void actualizarStock(Long productoId, Integer nuevoStock) {
        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        producto.setStock(nuevoStock);
        productoRepository.save(producto);
    }
}
