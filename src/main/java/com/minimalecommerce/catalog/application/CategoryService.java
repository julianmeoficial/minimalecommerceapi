package com.minimalecommerce.catalog.application;

import com.minimalecommerce.catalog.api.dto.CategoryRequest;
import com.minimalecommerce.catalog.api.dto.CategoryResponse;
import com.minimalecommerce.catalog.domain.Category;
import com.minimalecommerce.catalog.infrastructure.CategoryRepository;
import com.minimalecommerce.shared.domain.ConflictException;
import com.minimalecommerce.shared.domain.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CategoryService {

    private final CategoryRepository categories;

    public CategoryService(CategoryRepository categories) {
        this.categories = categories;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> list() {
        return categories.findAll().stream().map(CategoryResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public Category require(UUID id) {
        return categories.findById(id).orElseThrow(() -> new NotFoundException("categoría", id));
    }

    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        if (categories.existsByNameIgnoreCase(request.name())) {
            throw new ConflictException("CATEGORY_EXISTS", "Ya existe una categoría con ese nombre");
        }
        Category category = new Category();
        category.setName(request.name());
        category.setDescription(request.description());
        categories.save(category);
        return CategoryResponse.from(category);
    }
}
