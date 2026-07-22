#!/usr/bin/env python3
"""Parchea el initiatePayment del plugin MercadoPago para que cree preferencias reales."""
import sys

OLD = """    async initiatePayment(input) {
        return {
            id: "",
            data: {
                session_id: input.data?.session_id,
                amount: input.amount,
            },
        };
    }"""

NEW = """    async initiatePayment(input) {
        try {
            const preference = new mercadopago_1.Preference(this.client_);
            const result = await preference.create({
                body: {
                    items: [{
                        title: "Compra en Casa Tapputi",
                        quantity: 1,
                        unit_price: input.amount,
                    }],
                    external_reference: input.data?.session_id || "",
                }
            });
            return {
                id: result.id || "",
                data: {
                    session_id: input.data?.session_id,
                    amount: input.amount,
                    init_point: result.init_point,
                    sandbox_init_point: result.sandbox_init_point,
                },
            };
        } catch (error) {
            this.logger_?.warn("Error al crear preferencia MercadoPago Checkout Pro:", error?.message || error);
            return {
                id: "",
                data: {
                    session_id: input.data?.session_id,
                    amount: input.amount,
                },
            };
        }
    }"""

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    if OLD not in content:
        print(f"  ❌ No se encontró el código original en {filepath}")
        return False
    content = content.replace(OLD, NEW)
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"  ✅ Parche aplicado en {filepath}")
    return True

if __name__ == '__main__':
    patch_file(sys.argv[1])
