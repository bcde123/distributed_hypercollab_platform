cmake_minimum_required(VERSION 3.14)
project(AnalyticsEngine VERSION 1.0)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# nlohmann/json single-header lives in include/
include_directories(include)

# ── FIX #9: REQUIRED causes cmake to fail with a clear error instead of
#    silently producing broken binaries with unresolved symbols ────────────────
find_path(RDKAFKA_INCLUDE_DIR
    NAMES librdkafka/rdkafka.h
    REQUIRED
    HINTS /usr/local/include /usr/include /opt/homebrew/include
)
find_library(RDKAFKA_LIBRARY
    NAMES rdkafka
    REQUIRED
    HINTS /usr/local/lib /usr/lib /opt/homebrew/lib
)

find_path(HIREDIS_INCLUDE_DIR
    NAMES hiredis/hiredis.h
    REQUIRED
    HINTS /usr/local/include /usr/include /opt/homebrew/include
)
find_library(HIREDIS_LIBRARY
    NAMES hiredis
    REQUIRED
    HINTS /usr/local/lib /usr/lib /opt/homebrew/lib
)

add_executable(analytics_engine src/main.cpp)

target_include_directories(analytics_engine PRIVATE
    ${RDKAFKA_INCLUDE_DIR}
    ${HIREDIS_INCLUDE_DIR}
)

target_link_libraries(analytics_engine PRIVATE
    ${RDKAFKA_LIBRARY}
    ${HIREDIS_LIBRARY}
)

message(STATUS "rdkafka  : ${RDKAFKA_LIBRARY}")
message(STATUS "hiredis  : ${HIREDIS_LIBRARY}")
