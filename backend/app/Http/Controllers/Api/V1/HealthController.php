<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;

class HealthController extends Controller
{
    public function show(): JsonResponse
    {
        $time = CarbonImmutable::now('Asia/Tokyo')->format('Y-m-d\\TH:i:s.vP');

        return response()->json([
            'status' => 'ok',
            'time' => $time,
        ]);
    }
}
