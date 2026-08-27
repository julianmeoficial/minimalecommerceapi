package com.minimalecommerce.shared.media;

import org.springframework.web.multipart.MultipartFile;

public interface MediaStore {

    String store(MultipartFile file);

    byte[] load(String filename);

    void delete(String filename);
}
