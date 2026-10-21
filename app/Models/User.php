<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'phone', 'role', 'scope', 'provinsi', 'posko_id', 'organization', 'address', 'nik', 'is_verified', 'is_active'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_verified' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Posko penempatan untuk petugas BPBD Daerah
     */
    public function posko(): BelongsTo
    {
        return $this->belongsTo(PoskoWilayah::class, 'posko_id');
    }

    /**
     * Cek apakah akun memiliki cakupan pengawasan nasional
     */
    public function isNasional(): bool
    {
        return $this->scope === 'nasional';
    }

    /**
     * Cek apakah akun adalah BPBD Daerah
     */
    public function isDaerah(): bool
    {
        return $this->scope === 'daerah';
    }
}
