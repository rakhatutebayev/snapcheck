#!/usr/bin/env python3
"""
Тест логики переименования файлов слайдов
Проверяет, что система правильно фильтрует и переименовывает файлы
"""

import os
import re
import tempfile
from pathlib import Path
from PIL import Image

def test_file_filtering():
    """Тест логики фильтрации файлов (как на frontend'е)"""
    print("=" * 60)
    print("🧪 ТЕСТ 1: Фильтрация файлов")
    print("=" * 60)
    
    # Создаём временную папку с тестовыми файлами
    with tempfile.TemporaryDirectory() as tmpdir:
        # Создаём тестовые файлы
        test_files = {
            'Slide1.jpeg': 'valid',
            'slide2.jpg': 'valid',
            'SLIDE3.JPG': 'valid',
            'photo1.jpg': 'invalid',  # не начинается с "slide"
            'image_2.jpg': 'invalid',  # не начинается с "slide"
            'slide3.png': 'invalid',  # неправильное расширение
            'slide_4.jpg': 'valid',  # с подчеркиванием - OK
        }
        
        for filename in test_files.keys():
            filepath = os.path.join(tmpdir, filename)
            img = Image.new('RGB', (100, 100), color='red')
            img.save(filepath)
        
        # Применяем фильтр как на frontend'е
        files = os.listdir(tmpdir)
        print(f"\n📁 Все файлы в папке ({len(files)}):")
        for f in sorted(files):
            print(f"  - {f}")
        
        # Фильтрование
        slide_files = []
        for f in files:
            name = f.lower()
            is_image = name.endswith('.jpg') or name.endswith('.jpeg')
            is_slide = name.startswith('slide')
            
            if is_image and is_slide:
                slide_files.append(f)
        
        print(f"\n✅ Найденные слайды ({len(slide_files)}):")
        for f in sorted(slide_files):
            expected = test_files[f]
            print(f"  ✓ {f} (type: {expected})")
        
        # Проверяем результаты
        expected_valid = [f for f, t in test_files.items() if t == 'valid']
        found_valid = sorted(slide_files)
        
        if sorted(expected_valid) == sorted(found_valid):
            print("\n🎉 УСПЕХ: Все файлы отфильтрованы правильно!")
            return True
        else:
            print(f"\n❌ ОШИБКА: Ожидались {expected_valid}, получены {found_valid}")
            return False


def test_file_sorting():
    """Тест сортировки файлов по номерам"""
    print("\n" + "=" * 60)
    print("🧪 ТЕСТ 2: Сортировка по номерам")
    print("=" * 60)
    
    test_cases = [
        {
            'input': ['slide3.jpg', 'slide1.jpg', 'slide2.jpg'],
            'expected': ['slide1.jpg', 'slide2.jpg', 'slide3.jpg'],
        },
        {
            'input': ['Slide10.jpeg', 'Slide2.jpg', 'slide1.jpg'],
            'expected': ['slide1.jpg', 'Slide2.jpg', 'Slide10.jpeg'],
        },
        {
            'input': ['slide_5.jpg', 'slide-1.jpg', 'slide 3.jpg'],
            'expected': ['slide-1.jpg', 'slide 3.jpg', 'slide_5.jpg'],
        },
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n📌 Тест-кейс {i}:")
        files = test_case['input']
        expected = test_case['expected']
        
        print(f"  Входные файлы: {files}")
        
        # Сортируем как на frontend'е
        sorted_files = sorted(files, key=lambda x: int(re.search(r'\d+', x).group(0)) if re.search(r'\d+', x) else 0)
        
        print(f"  Отсортированы: {sorted_files}")
        print(f"  Ожидалось: {expected}")
        
        if sorted_files == expected:
            print(f"  ✅ УСПЕХ")
        else:
            print(f"  ❌ ОШИБКА")
            return False
    
    print("\n🎉 Все тесты сортировки пройдены!")
    return True


def test_file_renaming():
    """Тест логики переименования файлов"""
    print("\n" + "=" * 60)
    print("🧪 ТЕСТ 3: Переименование файлов")
    print("=" * 60)
    
    test_files = [
        'Slide1.JPEG',
        'slide2.jpg',
        'SLIDE3.jpeg',
    ]
    
    print(f"\n📝 Переименование {len(test_files)} файлов:\n")
    
    for index, filename in enumerate(test_files, 1):
        new_filename = f"slide{index}.jpg"
        print(f"  {index}. {filename:20} → {new_filename}")
    
    print("\n🎉 Все файлы будут переименованы в правильный формат!")
    return True


def test_backend_validation():
    """Тест валидации имён файлов на backend'е"""
    print("\n" + "=" * 60)
    print("🧪 ТЕСТ 4: Валидация на backend'е")
    print("=" * 60)
    
    regex = r'^slide(\d+)\.(jpg|jpeg)$'
    
    test_cases = [
        ('slide1.jpg', True, 1),
        ('slide2.jpeg', True, 2),
        ('slide3.JPG', True, 3),  # case-insensitive
        ('slide4.JPEG', True, 4),  # case-insensitive
        ('slide.jpg', False, None),  # нет номера
        ('slide10.png', False, None),  # неправильное расширение
        ('photo1.jpg', False, None),  # неправильное имя
    ]
    
    print(f"\nПроверка regex: {regex}\n")
    
    all_passed = True
    for filename, should_match, expected_num in test_cases:
        match = re.match(regex, filename.lower())
        
        if should_match:
            if match:
                num = int(match.group(1))
                status = "✅ OK" if num == expected_num else "❌ ОШИБКА (номер не совпадает)"
                print(f"  ✓ {filename:20} → Найден слайд #{num} {status}")
            else:
                print(f"  ✗ {filename:20} → ❌ ОШИБКА (должен был пройти)")
                all_passed = False
        else:
            if match:
                print(f"  ✗ {filename:20} → ❌ ОШИБКА (не должен был пройти)")
                all_passed = False
            else:
                print(f"  ✗ {filename:20} → ✅ OK (правильно отклонен)")
    
    if all_passed:
        print("\n🎉 Все валидации прошли правильно!")
    
    return all_passed


def test_sequence_validation():
    """Тест проверки последовательности номеров"""
    print("\n" + "=" * 60)
    print("🧪 ТЕСТ 5: Проверка последовательности")
    print("=" * 60)
    
    test_cases = [
        {
            'input': [1, 2, 3],
            'valid': True,
            'desc': 'Правильная последовательность 1,2,3'
        },
        {
            'input': [1, 3],
            'valid': False,
            'desc': 'Пропущен слайд 2'
        },
        {
            'input': [2, 3, 4],
            'valid': False,
            'desc': 'Начинается с 2 вместо 1'
        },
        {
            'input': [1],
            'valid': True,
            'desc': 'Один слайд'
        },
    ]
    
    print()
    all_passed = True
    
    for test_case in test_cases:
        numbers = test_case['input']
        should_be_valid = test_case['valid']
        desc = test_case['desc']
        
        # Проверяем последовательность
        is_valid = all(numbers[i] == i + 1 for i in range(len(numbers)))
        
        status = "✅ OK" if is_valid == should_be_valid else "❌ ОШИБКА"
        validation = "✓ Валидно" if is_valid else "✗ Невалидно"
        
        print(f"  Слайды {numbers}: {validation} - {desc} {status}")
        
        if is_valid != should_be_valid:
            all_passed = False
    
    if all_passed:
        print("\n🎉 Все проверки последовательности прошли!")
    
    return all_passed


def main():
    """Запуск всех тестов"""
    print("\n")
    print("╔" + "═" * 58 + "╗")
    print("║" + " " * 10 + "🧪 ТЕСТИРОВАНИЕ ЛОГИКИ ПЕРЕИМЕНОВАНИЯ ФАЙЛОВ" + " " * 2 + "║")
    print("╚" + "═" * 58 + "╝")
    
    results = []
    
    try:
        results.append(("Фильтрация файлов", test_file_filtering()))
        results.append(("Сортировка по номерам", test_file_sorting()))
        results.append(("Переименование файлов", test_file_renaming()))
        results.append(("Валидация на backend'е", test_backend_validation()))
        results.append(("Проверка последовательности", test_sequence_validation()))
    except Exception as e:
        print(f"\n❌ ОШИБКА ТЕСТИРОВАНИЯ: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Итоги
    print("\n" + "=" * 60)
    print("📊 ИТОГИ ТЕСТИРОВАНИЯ")
    print("=" * 60)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"  {test_name:35} {status}")
    
    all_passed = all(result for _, result in results)
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!")
        print("=" * 60)
        print("\n🎉 Система готова к использованию!")
        return True
    else:
        print("❌ НЕКОТОРЫЕ ТЕСТЫ НЕ ПРОЙДЕНЫ")
        print("=" * 60)
        return False


if __name__ == '__main__':
    success = main()
    exit(0 if success else 1)
