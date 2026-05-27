<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class UserController extends Controller
{
    public function index()
    {
        $users = User::latest()->get();
        return Inertia::render('Users/Index', [
            'users' => $users
        ]);
    }

    public function create()
    {
        return Inertia::render('Users/Form');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        return redirect()->route('users.index')->with('success', 'Usuario creado exitosamente.');
    }

    public function edit(User $user)
    {
        return Inertia::render('Users/Form', [
            'user' => $user
        ]);
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,'.$user->id,
            'password' => ['nullable', 'confirmed', Rules\Password::defaults()],
        ]);

        $user->name = $request->name;
        $user->email = $request->email;
        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }
        $user->save();

        return redirect()->route('users.index')->with('success', 'Usuario actualizado exitosamente.');
    }

    public function destroy(User $user)
    {
        // Prevenir que el usuario se elimine a sí mismo
        if (auth()->id() === $user->id) {
            return redirect()->back()->with('error', 'No puedes eliminar tu propia cuenta.');
        }
        
        $user->delete();
        return redirect()->route('users.index')->with('success', 'Usuario eliminado.');
    }
}
