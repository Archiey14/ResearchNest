package com.example.demo.repos;

import com.example.demo.models.ChatQuery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatQueryRepository extends JpaRepository<ChatQuery, Long> {

    List<ChatQuery> findTop500ByOrderByCreatedAtDesc();
}
