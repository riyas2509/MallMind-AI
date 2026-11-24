package com.mallmind.backend.exception;

public class InvalidFloorException extends RuntimeException {
    public InvalidFloorException(int floorNumber) {
        super("Floor " + floorNumber + " does not exist in this mall");
    }
}
