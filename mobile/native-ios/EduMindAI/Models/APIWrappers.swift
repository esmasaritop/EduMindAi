import Foundation

/// Common Laravel JSON shapes used in this backend.
struct DataEnvelope<T: Decodable>: Decodable {
    let data: T
}

/// Laravel Resource::collection() returns { "data": [ ... ], "links": { ... }, "meta": { ... } }
struct CollectionEnvelope<T: Decodable>: Decodable {
    let data: [T]
}

struct MessageEnvelope: Decodable {
    let message: String
}

