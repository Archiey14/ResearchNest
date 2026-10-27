package com.example.demo.repos;

import com.example.demo.models.Paper;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PaperRepository extends JpaRepository<Paper, Long> {

    List<Paper> findByTitleContainingIgnoreCase(String title);

    List<Paper> findByFieldIdIgnoreCase(String fieldId);

    List<Paper> findByFieldIgnoreCase(String field);

    @Query("SELECT p FROM Paper p WHERE " +
           "LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.authors) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.field) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.topicTag) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.venue) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Paper> searchAcrossFields(@Param("query") String query);

    List<Paper> findTop5ByOrderByCitationsDesc();
}
