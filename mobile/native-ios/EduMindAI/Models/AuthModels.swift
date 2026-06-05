import Foundation

struct LoginRequest: Encodable {
    let email: String
    let password: String
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
