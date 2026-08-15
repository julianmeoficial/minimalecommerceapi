package com.minimalecommerce.app.controller;

import com.minimalecommerce.app.model.Usuario;
import com.minimalecommerce.app.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UsuarioService usuarioService;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> loginData) {
        Map<String, Object> response = new HashMap<>();
        Usuario usuario = usuarioService.authenticateUser(
                loginData.get("email"),
                loginData.get("password"));

        if (usuario == null) {
            response.put("success", false);
            response.put("message", "Credenciales inválidas");
            return ResponseEntity.badRequest().body(response);
        }

        usuario.setPassword(null);
        response.put("success", true);
        response.put("user", usuario);
        return ResponseEntity.ok(response);
    }
}
