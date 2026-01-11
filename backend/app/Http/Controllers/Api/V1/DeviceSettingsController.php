<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DeviceSettingsController extends Controller
{
    private const REQUIRED_FIELDS = [
        'stable_duration_sec' => 'Stable duration sec',
        'max_session_sec' => 'Max session sec',
        'tare_weight' => 'Tare weight',
        'stability_epsilon_g' => 'Stability epsilon g',
        'sampling_hz' => 'Sampling hz',
        'moving_avg_window' => 'Moving avg window',
        'gross_weight_limit_g' => 'Gross weight limit g',
    ];

    public function show(string $device_id): JsonResponse
    {
        $deviceId = $device_id;
        if (!$this->deviceExists($deviceId)) {
            return $this->notFound();
        }

        $setting = DB::table('device_settings')->where('device_id', $deviceId)->first();
        if (!$setting) {
            return $this->notFound();
        }

        return response()->json($this->serialize($setting));
    }

    public function update(Request $request, string $device_id): JsonResponse
    {
        $deviceId = $device_id;
        $payload = $request->input('device_setting');
        if (!is_array($payload)) {
            return $this->unprocessable(['Device setting is invalid']);
        }

        $errors = $this->validatePayload($payload);
        if (!empty($errors)) {
            return $this->unprocessable($errors);
        }

        if (!$this->deviceExists($deviceId)) {
            return $this->notFound();
        }

        $setting = DB::table('device_settings')->where('device_id', $deviceId)->first();
        if (!$setting) {
            return $this->notFound();
        }

        $lockVersion = $this->parseInteger($payload['lock_version'] ?? null);
        if ($lockVersion === null || $lockVersion < 0) {
            return $this->unprocessable(['Lock version is invalid']);
        }

        $updatedAt = CarbonImmutable::now('UTC');
        $updatedAtValue = $updatedAt->format('Y-m-d H:i:s.u');
        $updateData = [
            'stable_duration_sec' => (int) $payload['stable_duration_sec'],
            'max_session_sec' => (int) $payload['max_session_sec'],
            'tare_weight' => (int) $payload['tare_weight'],
            'stability_epsilon_g' => (int) $payload['stability_epsilon_g'],
            'sampling_hz' => (int) $payload['sampling_hz'],
            'moving_avg_window' => (int) $payload['moving_avg_window'],
            'gross_weight_limit_g' => (int) $payload['gross_weight_limit_g'],
            'lock_version' => $lockVersion + 1,
            'updated_at' => $updatedAtValue,
        ];

        $updated = DB::table('device_settings')
            ->where('device_id', $deviceId)
            ->where('lock_version', $lockVersion)
            ->update($updateData);

        if ($updated === 0) {
            $currentVersion = DB::table('device_settings')
                ->where('device_id', $deviceId)
                ->value('lock_version');

            if ($currentVersion === null) {
                return $this->notFound();
            }

            return response()->json([
                'error' => 'conflict',
                'current_version' => (int) $currentVersion,
            ], 409);
        }

        $setting = (object) array_merge([
            'device_id' => $deviceId,
            'updated_at' => $updatedAtValue,
        ], $updateData);

        return response()->json($this->serialize($setting));
    }

    private function deviceExists(string $deviceId): bool
    {
        return DB::table('devices')->where('id', $deviceId)->exists();
    }

    private function notFound(): JsonResponse
    {
        return response()->json([
            'error' => 'not_found',
        ], 404);
    }

    private function unprocessable(array $messages): JsonResponse
    {
        return response()->json([
            'error' => 'unprocessable_entity',
            'messages' => array_values($messages),
        ], 422);
    }

    private function serialize(object $setting): array
    {
        $updatedAt = $this->formatUtcMillis($setting->updated_at ?? null);

        return [
            'device_id' => (string) $setting->device_id,
            'stable_duration_sec' => (int) $setting->stable_duration_sec,
            'max_session_sec' => (int) $setting->max_session_sec,
            'lock_version' => (int) $setting->lock_version,
            'tare_weight' => (int) $setting->tare_weight,
            'stability_epsilon_g' => (int) $setting->stability_epsilon_g,
            'sampling_hz' => (int) $setting->sampling_hz,
            'moving_avg_window' => (int) $setting->moving_avg_window,
            'gross_weight_limit_g' => (int) $setting->gross_weight_limit_g,
            'updated_at' => $updatedAt,
        ];
    }

    private function formatUtcMillis(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $time = CarbonImmutable::parse($value, 'UTC')->setTimezone('UTC');

        return $time->format('Y-m-d\\TH:i:s.v\\Z');
    }

    private function validatePayload(array $payload): array
    {
        $errors = [];

        foreach (self::REQUIRED_FIELDS as $field => $label) {
            if (!array_key_exists($field, $payload) || $payload[$field] === null || $payload[$field] === '') {
                $errors[] = $label . " can't be blank";
                $errors[] = $label . ' is not a number';
                continue;
            }

            $value = $this->parseInteger($payload[$field]);
            if ($value === null) {
                $errors[] = $label . ' is not a number';
                continue;
            }

            if ($value <= 0) {
                $errors[] = $label . ' must be greater than 0';
            }
        }

        return $errors;
    }

    private function parseInteger(mixed $value): ?int
    {
        if (is_int($value)) {
            return $value;
        }

        if (is_string($value) && preg_match('/\A-?\d+\z/', $value) === 1) {
            return (int) $value;
        }

        return null;
    }
}
