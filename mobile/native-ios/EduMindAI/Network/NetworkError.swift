import Foundation

enum NetworkError: Error, LocalizedError {
    case invalidURL
    case invalidResponse
    case httpError(statusCode: Int, message: String?)
    case decodingError(Error)
    case encodingError(Error)
    case noData

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Geçersiz URL."
        case .invalidResponse:
            return "Geçersiz sunucu yanıtı."
        case let .httpError(statusCode, message):
            return message ?? "HTTP Hatası (\(statusCode))."
        case let .decodingError(error):
            return "Yanıt çözümlenemedi: \(error.localizedDescription)"
        case let .encodingError(error):
            return "İstek gövdesi oluşturulamadı: \(error.localizedDescription)"
        case .noData:
            return "Sunucudan veri gelmedi."
        }
    }
}

