package com.mallmind.backend.client;

import com.mallmind.backend.dto.ml.DemandPrediction;
import com.mallmind.backend.dto.ml.ImageClassification;
import com.mallmind.backend.dto.ml.MlRecommendation;
import com.mallmind.backend.dto.voice.IntentResult;
import com.mallmind.backend.dto.voice.TranscriptionResult;
import com.mallmind.backend.exception.ModelServiceUnavailableException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Thin HTTP client for the Python model-service (Part 3.3/Part 10): all
 * six endpoints it exposes are wired here now (Phase 9 completes what
 * Phase 7's voice assistant started with /voice/* and /nlu/intent) --
 * /recommendations, /demand/{category}/predict and /vision/classify join
 * them.
 *
 * Every method converts a transport failure into
 * ModelServiceUnavailableException so callers degrade gracefully instead of
 * leaking a raw connection-refused exception -- the rest of the platform
 * has no dependency on this service being up.
 */
@Component
public class ModelServiceClient {

    private final RestClient restClient;

    public ModelServiceClient(@Value("${mallmind.model-service.base-url}") String baseUrl) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
    }

    public String transcribe(byte[] audioBytes, String filename) {
        try {
            ByteArrayResource resource = new ByteArrayResource(audioBytes) {
                @Override
                public String getFilename() {
                    return filename != null && !filename.isBlank() ? filename : "audio.wav";
                }
            };
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", resource);

            TranscriptionResult result = restClient.post()
                    .uri("/voice/transcribe")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(TranscriptionResult.class);

            if (result == null) {
                throw new ModelServiceUnavailableException("Speech-to-text returned an empty response");
            }
            return result.transcript();
        } catch (RestClientException ex) {
            throw new ModelServiceUnavailableException("Speech-to-text service unavailable: " + ex.getMessage(), ex);
        }
    }

    public IntentResult classifyIntent(String text) {
        try {
            IntentResult result = restClient.post()
                    .uri("/nlu/intent")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("text", text))
                    .retrieve()
                    .body(IntentResult.class);

            if (result == null) {
                throw new ModelServiceUnavailableException("Intent classification returned an empty response");
            }
            return result;
        } catch (RestClientException ex) {
            throw new ModelServiceUnavailableException("Intent classification service unavailable: " + ex.getMessage(), ex);
        }
    }

    public byte[] synthesizeSpeech(String text) {
        try {
            byte[] audio = restClient.post()
                    .uri("/voice/speak")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("text", text))
                    .retrieve()
                    .body(byte[].class);

            if (audio == null || audio.length == 0) {
                throw new ModelServiceUnavailableException("Text-to-speech returned no audio");
            }
            return audio;
        } catch (RestClientException ex) {
            throw new ModelServiceUnavailableException("Text-to-speech service unavailable: " + ex.getMessage(), ex);
        }
    }

    public List<MlRecommendation> recommend(String category, String brand, String color, Double maxBudget, int maxResults) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("category", category);
            body.put("brand", brand);
            body.put("color", color);
            body.put("max_budget", maxBudget);
            body.put("max_results", maxResults);

            List<MlRecommendation> result = restClient.post()
                    .uri("/recommendations")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(new org.springframework.core.ParameterizedTypeReference<List<MlRecommendation>>() {
                    });

            return result == null ? List.of() : result;
        } catch (RestClientException ex) {
            throw new ModelServiceUnavailableException("Recommendation service unavailable: " + ex.getMessage(), ex);
        }
    }

    public DemandPrediction predictDemand(String category) {
        try {
            DemandPrediction result = restClient.get()
                    .uri("/demand/{category}/predict", category)
                    .retrieve()
                    .body(DemandPrediction.class);

            if (result == null) {
                throw new ModelServiceUnavailableException("Demand prediction returned an empty response");
            }
            return result;
        } catch (org.springframework.web.client.HttpClientErrorException.NotFound notFound) {
            throw new com.mallmind.backend.exception.DemandCategoryNotFoundException(category);
        } catch (RestClientException ex) {
            throw new ModelServiceUnavailableException("Demand prediction service unavailable: " + ex.getMessage(), ex);
        }
    }

    public ImageClassification classifyImage(byte[] imageBytes, String filename) {
        try {
            ByteArrayResource resource = new ByteArrayResource(imageBytes) {
                @Override
                public String getFilename() {
                    return filename != null && !filename.isBlank() ? filename : "image.jpg";
                }
            };
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", resource);

            ImageClassification result = restClient.post()
                    .uri("/vision/classify")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(ImageClassification.class);

            if (result == null) {
                throw new ModelServiceUnavailableException("Image classification returned an empty response");
            }
            return result;
        } catch (RestClientException ex) {
            throw new ModelServiceUnavailableException("Image classification service unavailable: " + ex.getMessage(), ex);
        }
    }
}
