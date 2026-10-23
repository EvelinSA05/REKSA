<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LogAktivitas;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = LogAktivitas::with(['kebutuhan', 'posko', 'user']);

        if ($request->hasAny(['posko_id', 'kebutuhan_id'])) {
            if ($request->has('posko_id')) $query->where('posko_id', $request->posko_id);
            if ($request->has('kebutuhan_id')) $query->where('kebutuhan_id', $request->kebutuhan_id);
            $logs = $query->latest()->limit(50)->get();
        } else {
            $logs = \Illuminate\Support\Facades\Cache::remember('api_activity_logs_index', 30, function () use ($query) {
                return $query->latest()->limit(50)->get();
            });
        }

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }
}
