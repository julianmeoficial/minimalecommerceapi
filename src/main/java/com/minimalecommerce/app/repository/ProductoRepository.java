package com.minimalecommerce.app.repository;

import com.minimalecommerce.app.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {

    List<Producto> findByActivoTrue();

    List<Producto> findByNombreContainingIgnoreCase(String nombre);

    List<Producto> findByVendedorId(Long vendedorId);

    @Query("SELECT p FROM Producto p WHERE p.stock > 0 AND p.activo = true")
    List<Producto> findProductosDisponibles();

    @Query("SELECT p FROM Producto p WHERE p.categoria.id = :categoriaId AND p.stock > 0 AND p.activo = true")
    List<Producto> findByCategoriaIdAndStockDisponible(@Param("categoriaId") Long categoriaId);
}
