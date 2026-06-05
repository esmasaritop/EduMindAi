import Foundation

struct DataEnvelope<T: Decodable>: Decodable {
    let data: T
}

struct CollectionEnvelope<T: Decodable>: Decodable {
    let data: [T]
}

struct MessageEnvelope: Decodable {
    let message: String
}

struct MessageDataEnvelope<T: Decodable>: Decodable {
    let message: String?
    let data: T?
}

struct PaginatedEnvelope<T: Decodable>: Decodable {
    let data: [T]
}

struct APIClient {
    static let encoder: JSONEncoder = {
        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        return encoder
    }()

    static func encode<T: Encodable>(_ value: T) throws -> Data {
        do {
            return try encoder.encode(value)
        } catch {
            throw NetworkError.encodingError(error)
        }
    }
}
