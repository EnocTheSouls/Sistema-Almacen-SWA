using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace SistemaAlmacen.Api.Hubs;

// Mantiene la conexión en tiempo real
// de los usuarios autenticados.
[Authorize]
public sealed class NotificacionHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var rol =
            Context.User?
                .FindFirst(
                    System.Security.Claims
                        .ClaimTypes.Role
                )
                ?.Value
                ?.Trim();

        if (!string.IsNullOrWhiteSpace(
            rol))
        {
            await Groups.AddToGroupAsync(
                Context.ConnectionId,
                rol
            );
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(
        Exception? exception)
    {
        var rol =
            Context.User?
                .FindFirst(
                    System.Security.Claims
                        .ClaimTypes.Role
                )
                ?.Value
                ?.Trim();

        if (!string.IsNullOrWhiteSpace(
            rol))
        {
            await Groups.RemoveFromGroupAsync(
                Context.ConnectionId,
                rol
            );
        }

        await base.OnDisconnectedAsync(
            exception
        );
    }
}