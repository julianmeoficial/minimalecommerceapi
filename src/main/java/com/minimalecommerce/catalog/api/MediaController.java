package com.minimalecommerce.catalog.api;

import com.minimalecommerce.shared.media.MediaStore;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/media")
public class MediaController {

    private final MediaStore mediaStore;

    public MediaController(MediaStore mediaStore) {
        this.mediaStore = mediaStore;
    }

    @GetMapping("/{filename}")
    public ResponseEntity<byte[]> get(@PathVariable String filename) {
        byte[] bytes = mediaStore.load(filename);
        MediaType type = contentType(filename);
        return ResponseEntity.ok().contentType(type).body(bytes);
    }

    private MediaType contentType(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".png")) return MediaType.IMAGE_PNG;
        if (lower.endsWith(".webp")) return MediaType.parseMediaType("image/webp");
        return MediaType.IMAGE_JPEG;
    }
}
