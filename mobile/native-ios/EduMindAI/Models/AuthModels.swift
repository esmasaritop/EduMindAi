import Foundation

struct LoginRequest: Encodable {
    let email: String
    let password: String
}

struct AuthResponse: Decodable {
    let message: String?
    let user: User
    let token: String
}

