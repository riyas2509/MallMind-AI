package com.mallmind.backend.service.voice;

import com.mallmind.backend.dto.voice.NluEntities;

/**
 * Per-conversation slot memory (Part 15: conversational context). A fresh
 * search intent (PRODUCT_SEARCH, SHOP_SEARCH, NAVIGATION, FACILITY_SEARCH)
 * clears old slots first; REFINE_SEARCH keeps them and only overwrites
 * whatever the latest utterance actually mentioned, so "show me cheaper
 * ones" after "find me running shoes" still means running shoes.
 */
public class VoiceSlots {

    private String category;
    private String brand;
    private String color;
    private Double maxBudget;
    private String shop;
    private String facility;

    public void applyEntities(NluEntities entities, boolean freshSearch) {
        if (freshSearch) {
            reset();
        }
        if (entities.category() != null) category = entities.category();
        if (entities.brand() != null) brand = entities.brand();
        if (entities.color() != null) color = entities.color();
        if (entities.maxBudget() != null) maxBudget = entities.maxBudget();
        if (entities.shop() != null) shop = entities.shop();
        if (entities.facility() != null) facility = entities.facility();
    }

    public void reset() {
        category = null;
        brand = null;
        color = null;
        maxBudget = null;
        shop = null;
        facility = null;
    }

    public String getCategory() {
        return category;
    }

    public String getBrand() {
        return brand;
    }

    public String getColor() {
        return color;
    }

    public Double getMaxBudget() {
        return maxBudget;
    }

    public String getShop() {
        return shop;
    }

    public String getFacility() {
        return facility;
    }
}
