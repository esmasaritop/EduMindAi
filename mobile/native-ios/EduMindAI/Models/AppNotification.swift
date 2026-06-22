import Foundation

struct AppNotification: Codable, Identifiable {
    let id: Int
    let type: String?
    let title: String?
    let message: String?
    let metadata: [String: JSONValue]?
    let isRead: Bool
    let createdAt: String?
}

struct NotificationSummary: Decodable {
    let unreadCount: Int
}

enum JSONValue: Codable, Hashable {
    case string(String)
    case int(Int)
    case double(Double)
    case bool(Bool)
    case array([JSONValue])
    case object([String: JSONValue])
    case null

    init(from decoder: Decoder) throws {
        if var arrayContainer = try? decoder.unkeyedContainer() {
            var values: [JSONValue] = []
            while !arrayContainer.isAtEnd {
                values.append(try arrayContainer.decode(JSONValue.self))
            }
            self = .array(values)
            return
        }

        if let objectContainer = try? decoder.container(keyedBy: DynamicCodingKey.self) {
            var values: [String: JSONValue] = [:]
            for key in objectContainer.allKeys {
                values[key.stringValue] = try objectContainer.decode(JSONValue.self, forKey: key)
            }
            self = .object(values)
            return
        }

        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            self = .null
        } else if let value = try? container.decode(Bool.self) {
            self = .bool(value)
        } else if let value = try? container.decode(Int.self) {
            self = .int(value)
        } else if let value = try? container.decode(Double.self) {
            self = .double(value)
        } else if let value = try? container.decode(String.self) {
            self = .string(value)
        } else {
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unsupported JSON value")
        }
    }

    func encode(to encoder: Encoder) throws {
        switch self {
        case .array(let values):
            var container = encoder.unkeyedContainer()
            for value in values {
                try container.encode(value)
            }
        case .object(let values):
            var container = encoder.container(keyedBy: DynamicCodingKey.self)
            for (key, value) in values {
                try container.encode(value, forKey: DynamicCodingKey(stringValue: key))
            }
        default:
            var container = encoder.singleValueContainer()
            switch self {
            case .string(let value): try container.encode(value)
            case .int(let value): try container.encode(value)
            case .double(let value): try container.encode(value)
            case .bool(let value): try container.encode(value)
            case .null: try container.encodeNil()
            default: break
            }
        }
    }
}

private struct DynamicCodingKey: CodingKey {
    let stringValue: String
    let intValue: Int?

    init(stringValue: String) {
        self.stringValue = stringValue
        self.intValue = nil
    }

    init?(intValue: Int) {
        self.stringValue = String(intValue)
        self.intValue = intValue
    }
}
