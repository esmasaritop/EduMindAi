import Foundation

struct LoginRequest: Encodable {
    let email: String
    let password: String
    let deviceName: String

    enum CodingKeys: String, CodingKey {
        case email
        case password
        case deviceName = "device_name"
    }
}

struct RegisterRequest: Encodable {
    let name: String
    let email: String
    let password: String
    let passwordConfirmation: String
    let timezone: String
}

struct AuthResponse: Decodable {
    let message: String?
    let user: User
    let token: String
}
