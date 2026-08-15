package com.minimalecommerce.app.repository;

import com.minimalecommerce.app.model.TipoUsuario;
import com.minimalecommerce.app.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Usuario> findByActivoTrue();

    List<Usuario> findByTipousuarioAndActivoTrue(TipoUsuario tipousuario);
}
