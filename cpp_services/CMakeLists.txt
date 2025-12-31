cmake_minimum_required(VERSION 3.10)
project(HyperCollabRealtime)

set(CMAKE_CXX_STANDARD 17)

include_directories(include)

# Future: Add WebSocket libraries here (e.g., Boost, uWebSockets)

add_executable(realtime_server src/main.cpp)