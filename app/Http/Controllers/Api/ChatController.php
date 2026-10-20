<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatMessage;
use App\Models\LogAktivitas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ChatController extends Controller
{
    /**
     * Get list of chat messages, optionally filtered by channel or search term.
     */
    public function index(Request $request)
    {
        $query = ChatMessage::query();

        // Enforce channel privacy: Citizen cannot view internal posko_mitra discussions
        if ($request->query('role') === 'citizen') {
            if ($request->channel === 'posko_mitra') {
                return response()->json([
                    'success' => false,
                    'message' => 'Akses ditolak. Kanal ini khusus koordinasi internal Posko BPBD dan Mitra Penyalur.',
                    'data' => [],
                    'total' => 0,
                ], 403);
            }
            $query->where('channel', '!=', 'posko_mitra');
        }

        if ($request->filled('channel') && $request->channel !== 'all') {
            $query->where('channel', $request->channel);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('message', 'like', "%{$search}%")
                  ->orWhere('sender_name', 'like', "%{$search}%")
                  ->orWhere('sender_org', 'like', "%{$search}%")
                  ->orWhere('tag', 'like', "%{$search}%");
            });
        }

        $messages = $query->orderBy('created_at', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $messages,
            'total' => $messages->count(),
        ]);
    }

    /**
     * Send a new chat message connecting the 3 roles.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'message' => 'required|string|max:3000',
            'sender_name' => 'required|string|max:120',
            'sender_role' => 'required|string|in:citizen,posko,responder',
            'sender_org' => 'nullable|string|max:150',
            'channel' => 'nullable|string|max:50',
            'tag' => 'nullable|string|max:50',
            'kebutuhan_id' => 'nullable|integer',
            'posko_id' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi pesan gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $channel = $request->input('channel', 'umum');

        // Block citizen from sending to posko_mitra internal channel
        if ($request->sender_role === 'citizen' && $channel === 'posko_mitra') {
            return response()->json([
                'success' => false,
                'message' => 'Warga tidak diizinkan mengirim pesan ke kanal internal Posko & Mitra.',
            ], 403);
        }

        $message = ChatMessage::create([
            'channel' => $channel,
            'sender_name' => $request->sender_name,
            'sender_role' => $request->sender_role,
            'sender_org' => $request->sender_org,
            'message' => $request->message,
            'tag' => $request->tag,
            'kebutuhan_id' => $request->kebutuhan_id,
            'posko_id' => $request->posko_id,
        ]);

        // If high urgency message, record to activity log for system-wide awareness
        if ($request->tag === 'URGENT') {
            try {
                LogAktivitas::create([
                    'kebutuhan_id' => $request->kebutuhan_id,
                    'posko_id' => $request->posko_id,
                    'user_id' => null,
                    'user_name' => $request->sender_name,
                    'aksi' => 'Pesan Darurat Ruang Komunikasi',
                    'deskripsi' => "[{$request->sender_role}] {$request->sender_name}: " . substr($request->message, 0, 140),
                ]);
            } catch (\Exception $e) {
                // Silently ignore activity log errors
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Pesan berhasil dikirim.',
            'data' => $message,
        ], 201);
    }

    /**
     * Get available channels with statistics and latest preview.
     */
    public function channels(Request $request)
    {
        $role = $request->query('role');

        $channelDefinitions = [
            [
                'id' => 'umum',
                'name' => 'Kanal Umum (Siaga Bencana)',
                'description' => 'Koordinasi terbuka trilateral antara Warga, Posko BPBD, dan Mitra Kemanusiaan.',
                'icon' => 'globe',
                'badge' => 'Semua Role',
                'allowed_roles' => ['citizen', 'posko', 'responder'],
            ],
            [
                'id' => 'posko_mitra',
                'name' => 'Posko BPBD ⇄ Mitra Penyalur',
                'description' => 'Sinkronisasi stok gudang, armada lapangan, bursa bantuan, dan alokasi misi.',
                'icon' => 'truck',
                'badge' => 'BPBD & Mitra',
                'allowed_roles' => ['posko', 'responder'],
            ],
            [
                'id' => 'bantuan_warga',
                'name' => 'Layanan Warga & Kebutuhan',
                'description' => 'Konsultasi penerimaan bantuan, informasi lansia/balita, dan konfirmasi serah terima.',
                'icon' => 'users',
                'badge' => 'Warga & Responder',
                'allowed_roles' => ['citizen', 'posko', 'responder'],
            ],
        ];

        // Filter out channels not accessible by this role
        if ($role) {
            $channelDefinitions = array_values(array_filter($channelDefinitions, function ($ch) use ($role) {
                return in_array($role, $ch['allowed_roles']) || in_array('all', $ch['allowed_roles']);
            }));
        }

        foreach ($channelDefinitions as &$ch) {
            $latest = ChatMessage::where('channel', $ch['id'])
                ->orderBy('created_at', 'desc')
                ->first();

            $count = ChatMessage::where('channel', $ch['id'])->count();

            $ch['message_count'] = $count;
            $ch['latest_message'] = $latest ? [
                'sender_name' => $latest->sender_name,
                'sender_role' => $latest->sender_role,
                'message' => substr($latest->message, 0, 60),
                'created_at' => $latest->created_at->diffForHumans(),
            ] : null;
        }

        return response()->json([
            'success' => true,
            'data' => $channelDefinitions,
        ]);
    }
}
