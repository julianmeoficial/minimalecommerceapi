package com.minimalecommerce.app.service;

import com.minimalecommerce.app.model.Pedidoitem;
import com.minimalecommerce.app.repository.PedidoitemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class PedidoitemService {

    @Autowired
    private PedidoitemRepository pedidoitemRepository;

    public List<Pedidoitem> obtenerItemsPorPedido(Long pedidoId) {
        return pedidoitemRepository.findByPedidoId(pedidoId);
    }
}
