package com.minimalecommerce.shared.media;

import com.minimalecommerce.shared.domain.BusinessException;
import com.minimalecommerce.shared.domain.NotFoundException;
import com.minimalecommerce.shared.security.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;
import java.util.UUID;

@Component
public class LocalFileMediaStore implements MediaStore {

    private static final Logger log = LoggerFactory.getLogger(LocalFileMediaStore.class);
    private static final Set<String> ALLOWED = Set.of(".jpg", ".jpeg", ".png", ".webp");

    private final Path root;

    public LocalFileMediaStore(AppProperties properties) throws IOException {
        this.root = Path.of(properties.getUploadDir()).toAbsolutePath().normalize();
        Files.createDirectories(this.root);
    }

    @Override
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("EMPTY_FILE", "El archivo está vacío");
        }
        String original = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        String ext = original.contains(".") ? original.substring(original.lastIndexOf('.')).toLowerCase() : "";
        if (!ALLOWED.contains(ext)) {
            throw new BusinessException("UNSUPPORTED_MEDIA", "Formato no permitido: " + ext);
        }
        String filename = UUID.randomUUID() + ext;
        try {
            Files.copy(file.getInputStream(), root.resolve(filename));
            return filename;
        } catch (IOException e) {
            log.error("Failed to store media", e);
            throw new BusinessException("MEDIA_STORE_ERROR", "No se pudo guardar el archivo");
        }
    }

    @Override
    public byte[] load(String filename) {
        Path path = resolve(filename);
        if (!Files.exists(path)) {
            throw new NotFoundException("archivo", filename);
        }
        try {
            return Files.readAllBytes(path);
        } catch (IOException e) {
            throw new BusinessException("MEDIA_STORE_ERROR", "No se pudo leer el archivo");
        }
    }

    @Override
    public void delete(String filename) {
        try {
            Files.deleteIfExists(resolve(filename));
        } catch (IOException e) {
            log.warn("Could not delete {}", filename, e);
        }
    }

    private Path resolve(String filename) {
        Path path = root.resolve(filename).normalize();
        if (!path.startsWith(root)) {
            throw new BusinessException("INVALID_PATH", "Ruta de archivo inválida");
        }
        return path;
    }
}
