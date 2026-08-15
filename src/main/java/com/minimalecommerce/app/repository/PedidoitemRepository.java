package com.minimalecommerce.app.repository;

import com.minimalecommerce.app.model.Pedidoitem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PedidoitemRepository extends JpaRepository<Pedidoitem, Long> {

    List<Pedidoitem> findByPedidoId(Long pedidoId);
}
