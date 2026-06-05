import SwiftUI

struct AuthContainerView: View {
    @State private var showRegister = false

    var body: some View {
        if showRegister {
            RegisterView(showRegister: $showRegister)
        } else {
            LoginView(showRegister: $showRegister)
        }
    }
}

struct LoginView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @Binding var showRegister: Bool

    @State private var email = ""
    @State private var password = ""

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                Spacer()
                VStack(spacing: 8) {
                    Text("EduMindAI").font(.largeTitle.bold())
                    Text("Giriş yap").font(.title3).foregroundStyle(.secondary)
                }
                VStack(spacing: 12) {
                    TextField("E-posta", text: $email)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        .autocorrectionDisabled()
                        .textFieldStyle(.roundedBorder)
                    SecureField("Şifre", text: $password)
                        .textFieldStyle(.roundedBorder)
                }
                if let error = auth.errorMessage {
                    Text(error).font(.footnote).foregroundStyle(.red).frame(maxWidth: .infinity, alignment: .leading)
                }
                Button {
                    Task { await auth.login(email: email, password: password) }
                } label: {
                    HStack {
                        if auth.isLoading { ProgressView() }
                        Text("Giriş").bold()
                    }.frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .disabled(auth.isLoading || email.isEmpty || password.isEmpty)

                Button("Kayıt ol") { showRegister = true }
                    .font(.footnote)

                Spacer()
            }
            .padding()
        }
    }
}

struct RegisterView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @Binding var showRegister: Bool

    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var passwordConfirmation = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Hesap") {
                    TextField("Ad Soyad", text: $name)
                    TextField("E-posta", text: $email)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                    SecureField("Şifre", text: $password)
                    SecureField("Şifre tekrar", text: $passwordConfirmation)
                }
                if let error = auth.errorMessage {
                    Section {
                        Text(error).foregroundStyle(.red)
                    }
                }
                Section {
                    Button("Kayıt Ol") {
                        Task {
                            await auth.register(
                                name: name,
                                email: email,
                                password: password,
                                passwordConfirmation: passwordConfirmation
                            )
                        }
                    }
                    .disabled(auth.isLoading || name.isEmpty || email.isEmpty || password.isEmpty)
                    Button("Giriş yap") { showRegister = false }
                }
            }
            .navigationTitle("Kayıt Ol")
        }
    }
}
