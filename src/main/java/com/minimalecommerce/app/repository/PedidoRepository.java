package com.minimalecommerce.app.repository;

import com.minimalecommerce.app.model.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    @Query("SELECT p FROM Pedido p WHERE p.usuario.id = :usuarioId ORDER BY p.fechapedido DESC")
    List<Pedido> findByUsuarioIdOrderByFechapedidoDesc(@Param("usuarioId") Long usuarioId);
}
