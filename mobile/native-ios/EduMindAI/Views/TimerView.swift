import SwiftUI

struct TimerView: View {
    @StateObject private var vm = TimerViewModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    pickerSection
                    HStack(alignment: .top, spacing: 12) {
                        countdownPanel
                        stopwatchPanel
                    }
                    if let error = vm.errorMessage {
                        Text(error).foregroundStyle(.red)
                    }
                }
                .padding()
            }
            .navigationTitle("Zamanlayıcı")
            .task { await vm.load() }
        }
    }

    private var pickerSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Ders / Konu").font(.headline)
            Picker("Ders", selection: Binding(
                get: { vm.subjectId ?? 0 },
                set: { newValue in Task { await vm.subjectChanged(newValue == 0 ? nil : newValue) } }
            )) {
                Text("Seçin").tag(0)
                ForEach(vm.subjects) { subject in
                    Text(subject.name).tag(subject.id)
                }
            }
            .pickerStyle(.menu)
            Picker("Konu", selection: Binding(
                get: { vm.topicId ?? 0 },
                set: { vm.topicId = $0 == 0 ? nil : $0 }
            )) {
                Text("Opsiyonel").tag(0)
                ForEach(vm.topics) { topic in
                    Text(topic.name).tag(topic.id)
                }
            }
            .pickerStyle(.menu)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var countdownPanel: some View {
        VStack(spacing: 12) {
            Text("Geri Sayım").font(.headline)
            Stepper("Saat: \(vm.countdownHours)", value: $vm.countdownHours, in: 0...12)
            Stepper("Dakika: \(vm.countdownMinutes)", value: $vm.countdownMinutes, in: 0...59)
            HStack {
                ForEach([120, 150, 180], id: \.self) { preset in
                    Button("\(preset / 60)s") { vm.applyPreset(minutes: preset) }
                        .buttonStyle(.bordered)
                        .font(.caption)
                }
            }
            Text(vm.formattedTime(vm.mode == .countdown ? vm.remainingSeconds : vm.countdownHours * 3600 + vm.countdownMinutes * 60))
                .font(.title.monospacedDigit())
            HStack {
                Button(vm.isRunning && vm.mode == .countdown ? "Çalışıyor" : "Başlat") {
                    vm.startCountdown()
                }
                .disabled(vm.isRunning)
                Button("Kaydet") { Task { await vm.save() } }
                Button("Reset") { vm.reset() }
            }
            .buttonStyle(.bordered)
            .font(.caption)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var stopwatchPanel: some View {
        VStack(spacing: 12) {
            Text("Kronometre").font(.headline)
            Text(vm.formattedTime(vm.elapsedSeconds))
                .font(.title.monospacedDigit())
            HStack {
                Button(vm.isRunning && vm.mode == .stopwatch ? "Çalışıyor" : "Başlat") {
                    vm.startStopwatch()
                }
                .disabled(vm.isRunning && vm.mode != .stopwatch)
                Button("Kaydet") { Task { await vm.save() } }
                Button("Reset") { vm.reset() }
            }
            .buttonStyle(.bordered)
            .font(.caption)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}
