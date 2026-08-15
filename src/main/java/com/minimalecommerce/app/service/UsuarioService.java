package com.minimalecommerce.app.service;

import com.minimalecommerce.app.model.TipoUsuario;
import com.minimalecommerce.app.model.Usuario;
import com.minimalecommerce.app.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    public Usuario registrarUsuario(Usuario usuario) {
        if (usuarioRepository.existsByEmail(usuario.getEmail())) {
            throw new RuntimeException("Ya existe un usuario con ese email");
        }
        usuario.setId(null);
        usuario.setActivo(true);
        if (usuario.getTipousuario() == null) {
            usuario.setTipousuario(TipoUsuario.COMPRADOR);
        }
        return usuarioRepository.save(usuario);
    }

    public Usuario registrarVendedor(Usuario usuario) {
        usuario.setTipousuario(TipoUsuario.VENDEDOR);
        return registrarUsuario(usuario);
    }

    public Usuario authenticateUser(String email, String password) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
        if (usuarioOpt.isEmpty()) {
            return null;
        }
        Usuario usuario = usuarioOpt.get();
        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            return null;
        }
        if (password != null && password.equals(usuario.getPassword())) {
            return usuario;
        }
        return null;
    }

    public Optional<Usuario> obtenerUsuarioPorId(Long id) {
        return usuarioRepository.findById(id);
    }

    public List<Usuario> obtenerUsuariosActivos() {
        return usuarioRepository.findByActivoTrue();
    }

    public List<Usuario> obtenerCompradores() {
        return usuarioRepository.findByTipousuarioAndActivoTrue(TipoUsuario.COMPRADOR);
    }

    public List<Usuario> obtenerVendedores() {
        return usuarioRepository.findByTipousuarioAndActivoTrue(TipoUsuario.VENDEDOR);
    }

    public void desactivarUsuario(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        usuario.setActivo(false);
        usuarioRepository.save(usuario);
    }
}
