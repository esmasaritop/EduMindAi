import SwiftUI

struct TimerView: View {
    @StateObject private var vm = TimerViewModel()

    private let countdownPresets: [(label: String, hours: Int, minutes: Int)] = [
        ("2 sa", 2, 0),
        ("2,5 sa", 2, 30),
        ("3 sa", 3, 0),
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    pickerSection
                    countdownPanel
                    stopwatchPanel
                    if let error = vm.errorMessage {
                        Text(error)
                            .font(.subheadline)
                            .foregroundStyle(.red)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
                .padding()
            }
            .navigationTitle("Zamanlayıcı")
            .task { await vm.load() }
        }
    }

    private var pickerSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Ders / Konu")
                .font(.headline)

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
            .disabled(vm.isSelectionLocked)

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
            .disabled(vm.isSelectionLocked || vm.subjectId == nil)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var countdownPanel: some View {
        timerCard(
            title: "Geri Sayım",
            subtitle: "Deneme süresi ayarlayın",
            accent: .indigo,
            display: vm.formattedTime(vm.countdownDisplaySeconds),
            isRunning: vm.isRunning && vm.mode == .countdown
        ) {
            HStack(spacing: 12) {
                durationControl(
                    label: "Saat",
                    value: $vm.countdownHours,
                    range: 0...12,
                    disabled: vm.isSelectionLocked
                )
                durationControl(
                    label: "Dakika",
                    value: $vm.countdownMinutes,
                    range: 0...59,
                    disabled: vm.isSelectionLocked
                )
            }

            HStack(spacing: 8) {
                ForEach(countdownPresets, id: \.label) { preset in
                    Button(preset.label) {
                        vm.applyPreset(hours: preset.hours, minutes: preset.minutes)
                    }
                    .buttonStyle(.bordered)
                    .font(.caption.weight(.semibold))
                    .disabled(vm.isSelectionLocked)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        } actions: {
            timerActions(
                isRunning: vm.isRunning && vm.mode == .countdown,
                canStart: vm.canStartCountdown,
                canSave: vm.canSaveCountdown,
                accent: .indigo,
                onStart: vm.startCountdown,
                onStop: vm.stopCountdown,
                onSave: { Task { await vm.saveCountdown() } },
                onReset: vm.resetCountdown
            )
        }
    }

    private var stopwatchPanel: some View {
        timerCard(
            title: "Kronometre",
            subtitle: "Serbest çalışma süresi",
            accent: .cyan,
            display: vm.formattedTime(vm.elapsedSeconds),
            isRunning: vm.isRunning && vm.mode == .stopwatch
        ) {
            EmptyView()
        } actions: {
            timerActions(
                isRunning: vm.isRunning && vm.mode == .stopwatch,
                canStart: vm.canStartStopwatch,
                canSave: vm.canSaveStopwatch,
                accent: .cyan,
                onStart: vm.startStopwatch,
                onStop: vm.stopStopwatch,
                onSave: { Task { await vm.saveStopwatch() } },
                onReset: vm.resetStopwatch
            )
        }
    }

    private func timerCard<Content: View, Actions: View>(
        title: String,
        subtitle: String,
        accent: Color,
        display: String,
        isRunning: Bool,
        @ViewBuilder content: () -> Content,
        @ViewBuilder actions: () -> Actions
    ) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            content()

            Text(display)
                .font(.system(size: 44, weight: .bold, design: .monospaced))
                .foregroundStyle(isRunning ? accent : .primary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)

            actions()
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .overlay {
            RoundedRectangle(cornerRadius: 12)
                .stroke(isRunning ? accent.opacity(0.4) : Color.clear, lineWidth: 2)
        }
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func durationControl(
        label: String,
        value: Binding<Int>,
        range: ClosedRange<Int>,
        disabled: Bool
    ) -> some View {
        VStack(spacing: 6) {
            Text(label)
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)

            HStack(spacing: 0) {
                Button {
                    if value.wrappedValue > range.lowerBound {
                        value.wrappedValue -= 1
                    }
                } label: {
                    Image(systemName: "minus")
                        .font(.body.weight(.semibold))
                        .frame(width: 40, height: 40)
                }
                .disabled(disabled || value.wrappedValue <= range.lowerBound)

                Text("\(value.wrappedValue)")
                    .font(.title2.monospacedDigit().weight(.bold))
                    .frame(minWidth: 44)

                Button {
                    if value.wrappedValue < range.upperBound {
                        value.wrappedValue += 1
                    }
                } label: {
                    Image(systemName: "plus")
                        .font(.body.weight(.semibold))
                        .frame(width: 40, height: 40)
                }
                .disabled(disabled || value.wrappedValue >= range.upperBound)
            }
            .background(Color(.tertiarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 10))
        }
        .frame(maxWidth: .infinity)
    }

    private func timerActions(
        isRunning: Bool,
        canStart: Bool,
        canSave: Bool,
        accent: Color,
        onStart: @escaping () -> Void,
        onStop: @escaping () -> Void,
        onSave: @escaping () -> Void,
        onReset: @escaping () -> Void
    ) -> some View {
        VStack(spacing: 10) {
            if isRunning {
                Button(action: onStop) {
                    Label("Durdur", systemImage: "stop.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(.red)
                .controlSize(.large)
            } else {
                Button(action: onStart) {
                    Label("Başlat", systemImage: "play.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(accent)
                .controlSize(.large)
                .disabled(!canStart)
            }

            if !isRunning {
                HStack(spacing: 10) {
                    Button(action: onSave) {
                        Label("Kaydet", systemImage: "square.and.arrow.down")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.large)
                    .disabled(!canSave)

                    Button(action: onReset) {
                        Label("Sıfırla", systemImage: "arrow.counterclockwise")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.large)
                    .disabled(!canSave)
                }
            }
        }
    }
}
