package com.minimalecommerce.app.controller;

import com.minimalecommerce.app.model.Usuario;
import com.minimalecommerce.app.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    @PostMapping("/registro")
    public ResponseEntity<Usuario> registrarUsuario(@RequestBody Usuario usuario) {
        return ResponseEntity.ok(usuarioService.registrarUsuario(usuario));
    }

    @PostMapping("/registro/vendedor")
    public ResponseEntity<Usuario> registrarVendedor(@RequestBody Usuario usuario) {
        return ResponseEntity.ok(usuarioService.registrarVendedor(usuario));
    }

    @GetMapping
    public ResponseEntity<List<Usuario>> obtenerTodosUsuarios() {
        return ResponseEntity.ok(usuarioService.obtenerUsuariosActivos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Usuario> obtenerUsuarioPorId(@PathVariable Long id) {
        return usuarioService.obtenerUsuarioPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/compradores")
    public ResponseEntity<List<Usuario>> obtenerCompradores() {
        return ResponseEntity.ok(usuarioService.obtenerCompradores());
    }

    @GetMapping("/vendedores")
    public ResponseEntity<List<Usuario>> obtenerVendedores() {
        return ResponseEntity.ok(usuarioService.obtenerVendedores());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> desactivarUsuario(@PathVariable Long id) {
        usuarioService.desactivarUsuario(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Usuario desactivado");
        return ResponseEntity.ok(response);
    }
}
